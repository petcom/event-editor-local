#!/bin/sh

# Event Editor Management App
# Copyright (c) 2025

# Check if script is being run from the project root
if [ ! -f "package.json" ] || [ ! -f "index.html" ]; then
    echo "${RED}${CROSS_MARK} Error: This script must be run from the project root directory.${RESET}"
    echo "Please change to the project root directory and try again."
    exit 1
fi

# PID file location
PID_FILE=".ndc.pid"

#
# STYLING FUNCTIONS
#

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
BOLD='\033[1m'
RESET='\033[0m'

# Unicode characters
CHECK_MARK="✓"
CROSS_MARK="✗"
ARROW_RIGHT="→"
SPARKLES="✨"
ROCKET="🚀"
WRENCH="🔧"
STOP_SIGN="🛑"
GLOBE="🌐"
INFO_MARK="ℹ️"

# Function to display a stylized banner
show_banner() {
    local title="$1"
    local title_length=${#title}
    local box_width=50
    local padding=$(( (box_width - title_length - 2) / 2 ))
    local left_padding=$(printf "%${padding}s" "")
    local right_padding=$(printf "%${padding}s" "")

    # Adjust right padding if title length is odd
    if [ $(( (box_width - title_length) % 2 )) -eq 1 ]; then
        right_padding="$right_padding "
    fi

    echo "${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
    echo "${CYAN}║${RESET}$left_padding${BOLD}${BLUE}$title${RESET}  $right_padding${CYAN}║${RESET}"
    echo "${CYAN}╚══════════════════════════════════════════════════╝${RESET}"
    echo
}

# Function to show error message
show_error() {
    echo "${RED}${CROSS_MARK} Error: $1${RESET}" >&2
    exit 1
}

# Function to show success message
show_success() {
    echo "${GREEN}${CHECK_MARK} $1${RESET}"
}

# Function to print usage instructions
show_usage() {
    echo "${BOLD}Usage:${RESET} $0 ${CYAN}command${RESET}"
    echo
    echo "${BOLD}Available commands:${RESET}"
    echo "  ${CYAN}install${RESET}   ${ARROW_RIGHT} ${WRENCH} Install project dependencies"
    echo "  ${CYAN}start${RESET}     ${ARROW_RIGHT} ${ROCKET} Start the application in background"
    echo "  ${CYAN}stop${RESET}      ${ARROW_RIGHT} ${STOP_SIGN} Stop the running application"
    echo "  ${CYAN}restart${RESET}   ${ARROW_RIGHT} ${ROCKET} Restart the application"
    echo "  ${CYAN}status${RESET}    ${ARROW_RIGHT} ${GLOBE} Show application status and URLs"
    echo "  ${CYAN}launch${RESET}    ${ARROW_RIGHT} ${GLOBE} Open the application in browser"
    echo "  ${CYAN}help${RESET}      ${ARROW_RIGHT} ${INFO_MARK} Show detailed help information"
    echo
    echo "${BOLD}Example:${RESET} $0 ${CYAN}start${RESET}"
    echo
    echo "For more detailed help, run: $0 ${CYAN}help${RESET}"
}

#
# APP FUNCTIONS
#

# Function to initialize app environment
app_start() {
    # Save current directory
    APP_START_DIR=$(pwd)
}

# Function to exit app environment
app_exit() {
    # Restore original directory
    cd "$APP_START_DIR" || show_error "Failed to restore original directory"
    exit $1
}

# Function to check if application is running
app_is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to get the PID of the running application
app_get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    else
        echo "0"
    fi
}

# Function to install dependencies
app_install() {
    app_start

    echo "${YELLOW}${WRENCH} Installing dependencies...${RESET}"
    npm install || show_error "Failed to install dependencies"
    show_success "Dependencies installed successfully ${SPARKLES}"

    app_exit 0
}

# Function to start the application
app_start_server() {
    app_start

    # Check if application is running
    if app_is_running; then
        PID=$(app_get_pid)
        show_error "Application is already running. PID: $PID"
    fi

    echo "${YELLOW}${ROCKET} Starting application...${RESET}"

    # Create a log file for npm start output
    NPM_LOG="/tmp/npm_start_$$.log"

    # Start the application with output redirected to the log file
    npm start > "$NPM_LOG" 2>&1 &
    APP_PID=$!
    echo $APP_PID > "$PID_FILE"

    # Wait a moment to see if the application starts successfully
    sleep 3

    # Check if the process is still running
    if ps -p $APP_PID > /dev/null 2>&1; then
        show_success "Application started. PID: $APP_PID"
    else
        echo "${RED}${CROSS_MARK} Application failed to start. Check log at $NPM_LOG for details${RESET}"
        rm -f "$PID_FILE"
        exit 1
    fi

    app_exit 0
}

# Function to stop the application
app_stop() {
    app_start

    # Check if application is running
    if ! app_is_running; then
        show_error "Application is not running"
    fi

    PID=$(app_get_pid)
    echo "${YELLOW}${STOP_SIGN} Stopping application... PID: $PID${RESET}"
    kill $PID 2>/dev/null
    rm "$PID_FILE"
    show_success "Application stopped"

    app_exit 0
}

# Function to detect if running in WSL
is_wsl() {
    if grep -q Microsoft /proc/version 2>/dev/null; then
        return 0  # Running in WSL
    else
        return 1  # Not running in WSL
    fi
}

# Function to open URL in browser
open_url() {
    local url="$1"

    if is_wsl; then
        # WSL environment - use explorer.exe
        echo "${YELLOW}${INFO_MARK} WSL detected, using explorer.exe to open URL${RESET}"
        explorer.exe "$url" 2>/dev/null || show_error "Failed to open browser with explorer.exe"
    elif command -v xdg-open >/dev/null 2>&1; then
        # Linux with xdg-open
        xdg-open "$url" 2>/dev/null || show_error "Failed to open browser with xdg-open"
    elif command -v open >/dev/null 2>&1; then
        # macOS
        open "$url" 2>/dev/null || show_error "Failed to open browser with open"
    elif command -v start >/dev/null 2>&1; then
        # Windows
        start "$url" 2>/dev/null || show_error "Failed to open browser with start"
    else
        show_error "Could not detect a way to open the browser. Please open manually at: $url"
    fi
}

# Function to launch the application in browser
app_launch() {
    app_start

    # Flag to track if we just started the app
    JUST_STARTED=false

    # Check if application is running
    if ! app_is_running; then
        echo "${YELLOW}${INFO_MARK} Application is not running. Starting it now...${RESET}"

        # Start the application
        echo "${YELLOW}${ROCKET} Starting application...${RESET}"
        npm start > /dev/null 2>&1 &
        echo $! > "$PID_FILE"
        show_success "Application started. PID: $(cat "$PID_FILE")"

        # Set flag that we just started the app
        JUST_STARTED=true

        # Give the app a moment to initialize
        sleep 2
    fi

    echo "${YELLOW}${GLOBE} Opening application...${RESET}"

    # If we just started the app with npm start, don't do anything else
    # as npm start already launched Electron
    if [ "$JUST_STARTED" = true ]; then
        echo "${YELLOW}${INFO_MARK} Application already launched by npm start${RESET}"
    # If app was already running and Electron is available, try to launch Electron directly
    elif [ -f "./node_modules/.bin/electron" ]; then
        echo "${YELLOW}${INFO_MARK} Attempting to launch Electron directly...${RESET}"

        # Create a temporary log file for Electron output
        ELECTRON_LOG="/tmp/electron_launch_$$.log"

        # Try to launch Electron with output redirected to the log file
        ./node_modules/.bin/electron . > "$ELECTRON_LOG" 2>&1 &
        ELECTRON_PID=$!

        # Wait a moment to see if Electron starts successfully
        sleep 3

        # Check if Electron is still running
        if ps -p $ELECTRON_PID > /dev/null 2>&1; then
            echo "${GREEN}${CHECK_MARK} Electron launched successfully. PID: ${BOLD}$ELECTRON_PID${RESET}"
        else
            echo "${YELLOW}${CROSS_MARK} Electron failed to start. Falling back to browser.${RESET}"
            echo "${YELLOW}${INFO_MARK} Check log at $ELECTRON_LOG for details${RESET}"

            # Fall back to opening URL in browser
            echo "${YELLOW}${INFO_MARK} Opening URL in browser instead${RESET}"
            open_url "http://localhost:3000"
        fi
    # Otherwise, fall back to opening URL in browser
    else
        echo "${YELLOW}${INFO_MARK} Electron not found. Opening URL in browser${RESET}"
        open_url "http://localhost:3000"
    fi

    show_success "Application launched"

    app_exit 0
}

# Function to show detailed help
app_help() {
    app_start

    show_banner "Event Editor Management App - Help"

    echo "${BOLD}DESCRIPTION:${RESET}"
    echo "  This script provides a convenient way to manage the Event Editor application."
    echo "  It allows you to install dependencies, start/stop the application, check status,"
    echo "  and open the application in a browser."
    echo

    echo "${BOLD}USAGE:${RESET}"
    echo "  $0 ${CYAN}<command>${RESET}"
    echo

    echo "${BOLD}COMMANDS:${RESET}"
    echo "  ${CYAN}install${RESET}   ${ARROW_RIGHT} ${WRENCH} Install project dependencies"
    echo "  ${CYAN}start${RESET}     ${ARROW_RIGHT} ${ROCKET} Start the application in background"
    echo "  ${CYAN}stop${RESET}      ${ARROW_RIGHT} ${STOP_SIGN} Stop the running application"
    echo "  ${CYAN}restart${RESET}   ${ARROW_RIGHT} ${ROCKET} Restart the application"
    echo "  ${CYAN}status${RESET}    ${ARROW_RIGHT} ${GLOBE} Show application status and URLs"
    echo "  ${CYAN}launch${RESET}    ${ARROW_RIGHT} ${GLOBE} Open the application in browser (starts app if needed)"
    echo "  ${CYAN}help${RESET}      ${ARROW_RIGHT} ${INFO_MARK} Show this detailed help message"
    echo

    echo "${BOLD}EXAMPLES:${RESET}"
    echo "  ${GRAY}# Install dependencies${RESET}"
    echo "  $0 install"
    echo
    echo "  ${GRAY}# Start the application${RESET}"
    echo "  $0 start"
    echo
    echo "  ${GRAY}# Check application status${RESET}"
    echo "  $0 status"
    echo
    echo "  ${GRAY}# Restart the application${RESET}"
    echo "  $0 restart"
    echo
    echo "  ${GRAY}# Open in browser (starts app if needed)${RESET}"
    echo "  $0 launch"
    echo

    # Show WSL-specific information if applicable
    if is_wsl; then
        echo "${BOLD}WSL ENVIRONMENT:${RESET}"
        echo "  This script has detected that you are running in Windows Subsystem for Linux (WSL)."
        echo "  The ${CYAN}launch${RESET} command will:"
        echo "  1. Start the app if it's not running (this will launch Electron automatically)"
        echo "  2. If the app was already running and Electron is available, launch Electron directly"
        echo "  3. Otherwise use explorer.exe to open the URL in your Windows browser"
        echo
        echo "  You can also access the application directly in your Windows browser at:"
        echo "  ${BOLD}${BLUE}http://localhost:3000${RESET}"
        echo
    fi

    app_exit 0
}

# Function to show application status
app_status() {
    app_start

    echo "${YELLOW}${ROCKET} Checking application status...${RESET}"

    if ! app_is_running; then
        echo "${YELLOW}${CROSS_MARK} Application is not running${RESET}"
        app_exit 0
    fi

    PID=$(app_get_pid)
    echo "${GREEN}${CHECK_MARK} Application is running. PID: ${BOLD}$PID${RESET}"

    # Display URLs
    echo
    echo "${CYAN}${GLOBE} Available URLs:${RESET}"
    echo "${BOLD}${BLUE}http://localhost:3000${RESET} - Main application"
    echo "${BOLD}${BLUE}http://localhost:3000/events${RESET} - Events API"

    # Show access instructions based on environment
    echo
    if is_wsl; then
        echo "${CYAN}${INFO_MARK} WSL detected. You can access the application by:${RESET}"
        echo "  1. Running ${BOLD}./app.sh launch${RESET}"
        echo "  2. Opening ${BOLD}http://localhost:3000${RESET} in your Windows browser"
        if [ -f "./node_modules/.bin/electron" ]; then
            echo "  3. Running ${BOLD}./node_modules/.bin/electron .${RESET} directly"
        fi
    else
        echo "${CYAN}${INFO_MARK} You can access the application by running:${RESET}"
        echo "  ${BOLD}./app.sh launch${RESET}"
    fi

    app_exit 0
}

# Function to restart the application
app_restart() {
    app_start

    echo "${YELLOW}${ROCKET} Restarting application...${RESET}"

    # Stop the application if it's running
    if app_is_running; then
        PID=$(app_get_pid)
        echo "${YELLOW}${STOP_SIGN} Stopping application... PID: $PID${RESET}"
        kill $PID 2>/dev/null
        rm "$PID_FILE"
        echo "${GREEN}${CHECK_MARK} Application stopped${RESET}"
    else
        echo "${YELLOW}${INFO_MARK} Application was not running${RESET}"
    fi

    # Start the application
    echo "${YELLOW}${ROCKET} Starting application...${RESET}"

    # Create a log file for npm start output
    NPM_LOG="/tmp/npm_restart_$$.log"

    # Start the application with output redirected to the log file
    npm start > "$NPM_LOG" 2>&1 &
    APP_PID=$!
    echo $APP_PID > "$PID_FILE"

    # Wait a moment to see if the application starts successfully
    sleep 3

    # Check if the process is still running
    if ps -p $APP_PID > /dev/null 2>&1; then
        show_success "Application restarted. PID: $APP_PID"
    else
        echo "${RED}${CROSS_MARK} Application failed to restart. Check log at $NPM_LOG for details${RESET}"
        rm -f "$PID_FILE"
        exit 1
    fi

    app_exit 0
}

# Function to print usage and exit
app_usage() {
    show_usage
    exit 1
}

#
# MAIN EXECUTION
#

# Display banner
show_banner "Event Editor Management App"

# Check for command
if [ $# -eq 0 ]; then
    app_usage
fi

# Process command
COMMAND=$1
shift

case "$COMMAND" in
    install)
        app_install "$@"
        ;;
    start)
        app_start_server "$@"
        ;;
    stop)
        app_stop "$@"
        ;;
    restart)
        app_restart "$@"
        ;;
    status)
        app_status "$@"
        ;;
    launch)
        app_launch "$@"
        ;;
    help)
        app_help "$@"
        ;;
    *)
        app_usage
        ;;
esac

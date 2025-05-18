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
    echo "${CYAN}║${RESET}$left_padding${BOLD}${BLUE}$title${RESET}$right_padding${CYAN}║${RESET}"
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
    echo "  ${CYAN}launch${RESET}    ${ARROW_RIGHT} ${GLOBE} Open the application in browser"
    echo
    echo "${BOLD}Example:${RESET} $0 ${CYAN}start${RESET}"
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
    npm start > /dev/null 2>&1 &
    echo $! > "$PID_FILE"
    show_success "Application started. PID: $(cat "$PID_FILE")"

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

# Function to launch the application in browser
app_launch() {
    app_start

    # Check if application is running
    if ! app_is_running; then
        show_error "Application is not running. Please start it first."
    fi

    echo "${YELLOW}${GLOBE} Opening browser...${RESET}"
    open_browser

    show_success "Browser launched"

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
    launch)
        app_launch "$@"
        ;;
    *)
        app_usage
        ;;
esac

#!/bin/bash

# Ensure gws is installed
if ! command -v gws &> /dev/null; then
    echo "Installing @googleworkspace/cli..."
    npm install -g @googleworkspace/cli
fi

# Check if authenticated by running a simple command
if ! gws calendar +agenda --today --format json &> /dev/null; then
    echo "⚠️ Authentication required!"
    echo ""
    echo "Because of Google's security policies, you must authorize access via a secure web browser login."
    echo "There is no way to automate this step with AI."
    echo ""
    echo "Please open your computer's terminal and run the following:"
    echo "  gcloud auth login"
    echo "  gws auth setup"
    echo ""
    echo "I must refuse to continue until you complete this manual setup. Once you finish, ask me to run your digest again!"
    exit 1
fi

echo "✅ Authenticated! Fetching your data..." >&2

CALENDAR=$(gws calendar +agenda --today --format json 2>/dev/null || echo "[]")
EMAILS=$(gws gmail +triage --format json --max 15 2>/dev/null || echo "[]")

# Output raw JSON so Desktop Commander can format it
cat <<EOF
{
  "calendar": $CALENDAR,
  "emails": $EMAILS
}
EOF

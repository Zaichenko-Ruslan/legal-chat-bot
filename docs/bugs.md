# Bug: Encoding Error on Windows

**Status: Resolved**

**Original Error:**
`'charmap' codec can't encode character '\U0001f60a'`

**Root Cause:**
The backend startup script in `package.json` did not correctly apply the `PYTHONUTF8=1` environment variable before the Python interpreter started, leading to encoding errors on Windows when processing special characters.

**Resolution:**
Replaced the problematic `dotenv-cli` package with `cross-env` and updated the `dev` script to prepend the backend command with `cross-env PYTHONUTF8=1`. This ensures the environment variable is set correctly before the server launches.
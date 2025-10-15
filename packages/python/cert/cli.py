"""
CERT Framework CLI

Command-line interface for CERT framework operations.
"""

import argparse
import sys


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="CERT Framework - LLM Reliability Testing"
    )
    parser.add_argument(
        "command", choices=["test", "inspect", "version"], help="Command to run"
    )
    parser.add_argument(
        "--port", type=int, default=5000, help="Port for inspector UI (default: 5000)"
    )

    args = parser.parse_args()

    if args.command == "version":
        from cert import __version__

        print(f"CERT Framework v{__version__}")
        return 0

    elif args.command == "inspect":
        try:
            from cert.inspector import run_inspector

            print(f"🚀 Starting CERT Inspector on http://localhost:{args.port}")
            print("📝 Press Ctrl+C to stop")
            run_inspector(port=args.port)
        except ImportError:
            print(
                "❌ Inspector requires Flask. Install with: pip install cert-framework[inspector]"
            )
            return 1

    elif args.command == "test":
        print("Running tests...")
        # Add test discovery logic here
        print("⚠️  Test discovery coming soon. Use Python API for now.")

    return 0


if __name__ == "__main__":
    sys.exit(main())

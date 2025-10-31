import sys
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--stdin', action='store_true')
args = parser.parse_args()

print(f"args.stdin = {args.stdin}", file=sys.stderr)

if args.stdin:
    data = sys.stdin.read()
    print(f"Read {len(data)} bytes from stdin", file=sys.stderr)
    print(f"Data: {data[:100]}", file=sys.stderr)
else:
    print("No --stdin flag", file=sys.stderr)


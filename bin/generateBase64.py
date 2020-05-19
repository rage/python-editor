import base64

files = [
    ("static/skulpt.min.js", "skulptMinJsSource64.ts"),
    ("static/skulpt-stdlib.js", "skulptStdlibJsSource64.ts"),
    ("src/components/worker.js", "workerJsSource64.ts")
]

for (file, target) in files:
    f = open(file, "r")
    e = base64.b64encode(bytes(f.read(), "utf-8")).decode("ascii")
    f.close()
    f = open(f"src/constants/{target}", "w", newline="\n")
    f.write(f"export default \"{e}\"\n")
    f.close()

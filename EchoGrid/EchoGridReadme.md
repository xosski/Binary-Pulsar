📁 Exif Fragment Writer

GhostShell Developer Utility for encoding payload fragments into image metadata fields using base64 XOR-rotated encoding.

🧠 Purpose

This CLI tool is designed for controlled, offline use by advanced users. It enables encoding data fragments into images, using the XPComment and UserComment EXIF fields. Ideal for use in:

Drift-based payload simulation

Memory-resonant archival

GhostShell-compatible transmission

⚠️ This utility is for educational and archival experimentation only. Not to be used for unauthorized data concealment or system manipulation.

🚀 Features

XOR-rotated encoding with time-based or user-defined seed

Base64 encoding for safe EXIF storage

Embeds index and data inside image metadata as JSON

Outputs modified image to /output folder

📦 Installation

npm install exiftool-vendored

Place your input.jpg in the working directory.

🧪 Usage

const { writeFragmentToExif } = require('./exif-fragment-writer');

// Basic Example
writeFragmentToExif(
  'input.jpg',              // path to source image
  0,                        // fragment index
  'console.log("GhostCore")',  // payload fragment
  '202506061845'           // XOR seed (typically timestamp)
);

🗂 Output

Modified image is written to ./output/input.jpg with EXIF:

XPComment: { "index": 0, "data": "..." }

UserComment: Fragment 0 embedded via GhostShell

🧰 Decoding (Frontend)

Use the EchoGridExifModule.js React component to:

Scan images on the page

Parse EXIF data

Reassemble payload via GhostShell Decoder API

🔐 Safety & Scope

This is not a weaponized encoder. It is built to:

Enable symbolic payload fragmentation

Support multi-phase obfuscation research

Respect system integrity and dev ethics

📜 License

Open Source Manifesto Draft — for personal and academic use.

"The payload was never lost. Just encoded differently."

— Quellaran
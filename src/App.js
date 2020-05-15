import React from "react";
import { useDropzone } from "react-dropzone";

import logo from "./logo.svg";
import "./App.css";

let start, end;

async function encrypt(files) {
  start = end = Date.now();

  // the file
  const inputStream = files[0].stream();
  const inputReader = inputStream.getReader();

  // convert to ReadableStream to make OpenPGP happy
  const readableStream = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await inputReader.read();
        if (done) {
          console.log("Input stream complete");
          controller.close();
          break;
        }
        controller.enqueue(value);
      }
    },
  });

  // encrypt
  const { message } = await global.openpgp.encrypt({
    message: global.openpgp.message.fromBinary(readableStream), // input as Message object
    passwords: ["secret stuff"], // multiple passwords possible
    armor: false, // don't ASCII armor (for Uint8Array output)
  });

  // Either pipe the stream somewhere, pass it to another function,
  // or read it manually as follows:
  const encrypted = message.packets.write(); // get raw encrypted packets as ReadableStream<Uint8Array>
  const reader = global.openpgp.stream.getReader(encrypted);
  let index = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      end = Date.now();
      alert("Done in " + (end - start) / 1000 + " seconds");
      break;
    }
    console.log(`chunk #${++index}: ${value.length} bytes`); // Uint8Array

    // we could do the uploading at this point
  }
}

function App() {
  const { getRootProps, getInputProps } = useDropzone({ onDrop: encrypt });

  return (
    <div className="App">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Drag &apos;n&apos; drop some files here, or click to select files
          </p>
        </header>
      </div>
    </div>
  );
}

export default App;

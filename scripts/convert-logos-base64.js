import fs from "fs"
import path from "path"

const logos = [
  { name: "santaddeo", file: "public/santaddeo-logo.png" },
  { name: "4bid", file: "public/logo.png" },
]

for (const logo of logos) {
  const filePath = path.join("/app", logo.file)
  const buffer = fs.readFileSync(filePath)
  const base64 = buffer.toString("base64")
  const ext = path.extname(logo.file).replace(".", "")
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png"
  const dataUrl = `data:${mimeType};base64,${base64.substring(0, 60)}...`
  console.log(`${logo.name}: ${dataUrl.substring(0, 80)}`)
  console.log(`Full length: ${base64.length} chars`)
  
  // Write full base64 to a separate file for use in code
  fs.writeFileSync(
    path.join("/app/scripts", `${logo.name}-logo-base64.txt`),
    `data:${mimeType};base64,${base64}`
  )
}

console.log("Base64 files written to scripts/")

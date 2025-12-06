#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_NAME = 'Himam-System-Full'
const OUTPUT_DIR = path.join(__dirname, '..')
const OUTPUT_ZIP = path.join(OUTPUT_DIR, `${PROJECT_NAME}.zip`)

// Files and directories to exclude from the zip
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  '.env',
  '.env.local',
  '*.log',
  '.DS_Store',
  'dist',
  'build',
  'coverage',
  '.vercel',
  '.cache',
]

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return regex.test(filePath)
    }
    return filePath.includes(pattern)
  })
}

function createZip() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(OUTPUT_ZIP)
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2)
      console.log(`✅ Successfully created ${PROJECT_NAME}.zip`)
      console.log(`   Size: ${sizeMB} MB`)
      console.log(`   Location: ${OUTPUT_ZIP}`)
      resolve()
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)

    // Add all files from the project directory
    const projectDir = path.join(__dirname, PROJECT_NAME)
    
    function addDirectory(dir, baseDir = dir) {
      const files = fs.readdirSync(dir)

      files.forEach(file => {
        const filePath = path.join(dir, file)
        const relativePath = path.relative(baseDir, filePath)
        const stat = fs.statSync(filePath)

        if (shouldExclude(relativePath)) {
          return
        }

        if (stat.isDirectory()) {
          addDirectory(filePath, baseDir)
        } else {
          archive.file(filePath, { name: path.join(PROJECT_NAME, relativePath) })
        }
      })
    }

    if (fs.existsSync(projectDir)) {
      addDirectory(projectDir, projectDir)
    } else {
      // If running from within the project, use current directory
      const currentDir = __dirname
      addDirectory(currentDir, currentDir)
    }

    archive.finalize()
  })
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'zip') {
    console.log('📦 Creating deployment package...')
    try {
      await createZip()
      console.log('\n✨ Package ready for deployment!')
      console.log('\n📋 Next steps:')
      console.log('   1. Extract the zip file')
      console.log('   2. Run: npm install')
      console.log('   3. Copy .env.example to .env and fill in your credentials')
      console.log('   4. Import Supabase schema and seed data')
      console.log('   5. Import n8n workflows')
      console.log('   6. Deploy to Vercel or Render')
    } catch (error) {
      console.error('❌ Error creating zip:', error)
      process.exit(1)
    }
  } else {
    console.log('🚀 Al-Himam Smart Medical Platform - Setup Script')
    console.log('\nUsage:')
    console.log('  node setup-enterprise.mjs zip    - Create deployment package')
    console.log('\nAvailable commands:')
    console.log('  zip  - Creates a ready-to-deploy zip package')
  }
}

main().catch(console.error)


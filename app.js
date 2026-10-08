// found this lib online, does the ai stuff right in the browser lol no backend needed
const CDN_ESM = "https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm"

let uploadedFile = null
let resultBlob   = null

const dropzone = document.getElementById('dropzone')
const fileInput= document.getElementById('fileInput')
const originalImg = document.getElementById('originalImg')
const resultImg = document.getElementById('resultImg')
const removeBtn= document.getElementById('removeBtn')
const dlBtn =document.getElementById('dlBtn')
const loader  =document.getElementById('loader')
const loaderTxt = document.getElementById('loaderText')


// when they click "pick a file" instead of dragging
fileInput.addEventListener('change', e =>{
  let f = e.target.files[0]
  if( !f ) return
  loadFile(f)
})


// drag n drop - honestly took forever to figure this out
dropzone.addEventListener('dragover', e =>{
  e.preventDefault()
  dropzone.classList.add('dragging')
})

dropzone.addEventListener('dragleave', ()=>{
  dropzone.classList.remove('dragging')
})

dropzone.addEventListener('drop', e =>{
  e.preventDefault()
  dropzone.classList.remove('dragging')

  let file = e.dataTransfer.files[0]
  if( !file || !file.type.startsWith('image/') ) return
  loadFile(file)
})


function loadFile(f){
  uploadedFile = f
  resultBlob   = null

  // just slap the image in there so they can see what they picked
  let url = URL.createObjectURL(f)
  originalImg.src           = url
  originalImg.style.display = 'block'

  // clear old result if they pick a new image
  resultImg.src           = ''
  resultImg.style.display = 'none'
  dlBtn.disabled          = true

  removeBtn.disabled = false
}


removeBtn.addEventListener('click', async ()=>{
  if( !uploadedFile ) return

  // hide the loader and lock buttons so they cant spam click
  loader.classList.remove('hidden')
  removeBtn.disabled = true
  dlBtn.disabled     = true

  loaderTxt.textContent = 'processing... this might take a sec'

  try{
    // lazy load the lib only when needed, also tell it where to find the model files
    const { removeBackground } = await import(CDN_ESM)

    // heads up - first time takes forever cuz it downloads like 40mb model
    let blob = await removeBackground(uploadedFile, {
      progress : (key, cur, total) =>{
        if( key && key.startsWith('fetch:') ){
          if( total > 0 ){
            let pct = Math.round((cur / total) * 100)
            loaderTxt.textContent = `downloading model... ${pct}%`
          } else {
            loaderTxt.textContent = 'downloading model...'
          }
        } else {
          loaderTxt.textContent = 'processing image... almost there'
        }
      }
    })

    resultBlob = blob
    let resultUrl = URL.createObjectURL(blob)

    resultImg.src           = resultUrl
    resultImg.style.display = 'block'
    dlBtn.disabled          = false

    loaderTxt.textContent = 'done!'
    setTimeout(()=> loader.classList.add('hidden'), 800)

  } catch(err){
    console.error('something went wrong:', err)
    // show the actual error so we can debug it
    loaderTxt.textContent = 'error: ' + (err?.message || err)
    removeBtn.disabled    = false
  }
})


// create a fake link and click it, kinda hacky but it works
dlBtn.addEventListener('click', ()=>{
  if( !resultBlob ) return

  let a      = document.createElement('a')
  a.href     = URL.createObjectURL(resultBlob)
  a.download = 'no-bg.png'
  a.click()
})

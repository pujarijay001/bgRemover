// using official huggingface transformers library - works in browser and no dodgy domain warnings lol
import { pipeline, RawImage } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3'

let uploadedFile = null
let resultBlob   = null
let segmenter    = null

const dropzone    = document.getElementById('dropzone')
const fileInput   = document.getElementById('fileInput')
const originalImg = document.getElementById('originalImg')
const resultImg   = document.getElementById('resultImg')
const removeBtn   = document.getElementById('removeBtn')
const dlBtn       = document.getElementById('dlBtn')
const loader      = document.getElementById('loader')
const loaderTxt   = document.getElementById('loaderText')


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

  loaderTxt.textContent = 'loading model from hugging face... this takes a moment first time'

  try{
    if( !segmenter ){
      // loads model directly from official huggingface repo
      segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
        progress_callback : (info) =>{
          if( info.status === 'progress' && info.total ){
            let pct = Math.round((info.loaded / info.total) * 100)
            loaderTxt.textContent = `downloading model: ${pct}%`
          } else if( info.status === 'ready' ){
            loaderTxt.textContent = 'processing image...'
          }
        }
      })
    }

    loaderTxt.textContent = 'removing background...'

    // read uploaded file
    let imgUrl = URL.createObjectURL(uploadedFile)
    let raw = await RawImage.fromURL(imgUrl)

    // run segmentation
    let output = await segmenter(raw)

    // output is mask image, convert to blob to display
    let canvas = output[0].mask.toCanvas()
    
    // combine mask with original image into clean transparent cutout
    let resultCanvas = document.createElement('canvas')
    resultCanvas.width  = raw.width
    resultCanvas.height = raw.height
    let ctx = resultCanvas.getContext('2d')

    let tempImg = new Image()
    tempImg.src = imgUrl
    await new Promise(r => tempImg.onload = r)

    // draw mask
    ctx.drawImage(canvas, 0, 0, raw.width, raw.height)
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(tempImg, 0, 0, raw.width, raw.height)

    // export to png blob
    resultCanvas.toBlob(blob =>{
      resultBlob = blob
      let resultUrl = URL.createObjectURL(blob)

      resultImg.src           = resultUrl
      resultImg.style.display = 'block'
      dlBtn.disabled          = false

      loaderTxt.textContent = 'done!'
      setTimeout(()=> loader.classList.add('hidden'), 800)
    }, 'image/png')

  } catch(err){
    console.error('something went wrong:', err)
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

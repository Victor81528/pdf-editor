<script setup>
import { ref, computed } from 'vue';
import VuePdfEmbed from 'vue-pdf-embed'
import { PDFDocument } from 'pdf-lib'

import { useGlobalStore } from '../store/global.js'
import { useImageStore } from '../store/image.js'

import ImageEditBox from './ImageEditBox.vue'
import SignaturePad from './SignaturePad.vue';

import { blobToBase64 } from '../utils.js'

const globalStore = useGlobalStore()
const imageStore = useImageStore()

const pdfRef = ref(null)
const pdfPage = ref(1)
const isPadOpen = ref(false)
const test = ref(0)

const isImages = computed(() => {
    return imageStore.images.length === 0
})

const handleChangePage = (n) => {

    n = parseInt(n)
    if (n > pdfRef.value.pageCount) n = pdfRef.value.pageCount
    else if (n < 1) n = 1

    pdfPage.value = n

    test.value += 1
}

const handleUpload = () => {
    
    const fileInput = document.createElement('input')

    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.onchange = () => {
        const file = fileInput.files[0]

        const image = new Image()
        image.src = URL.createObjectURL(file)
        image.onload = () => {
            const width = image.width
            const height = image.height
    
            imageStore.images.push({
                url: URL.createObjectURL(file),
                page: pdfPage.value,
                x: 0,
                y: 0,
                w: 300,
                h: 300 / width * height
            })
        }
        
    }
    
    fileInput.click()
}

// 將圖片加入PDF
const handleAddImage = async (imgageInfo, pdfDoc) => {

    // 取得PDF頁數
    const pages = pdfDoc.getPages()
    const page = pages[imgageInfo.page - 1]

    const img = imgageInfo.url

    // 加載圖片
    const pngImageBytes = await fetch(img).then((res) => res.arrayBuffer())

    // 加入圖片
    const pngImage = await pdfDoc.embedPng(pngImageBytes)

    const canvasStyle = document.getElementsByTagName('canvas')[0].style

    const canvasWidth = canvasStyle.width.slice(0, -2)
    parseFloat(canvasWidth)

    const canvasHeight = canvasStyle.height.slice(0, -2)
    parseFloat(canvasHeight)

    const scale = page.getWidth() / canvasWidth



    // 取得pdf的原始寬度
    console.log(page.getWidth());
    // 取得pdf的原始寬度



    // 圖片放置在PDF上的位置
    page.drawImage(pngImage, {
        // x: imgageInfo.x * scale,
        x: imgageInfo.x / canvasWidth * page.getWidth(),
        y: (canvasHeight - imgageInfo.y - imgageInfo.h) * scale,
        width:  imgageInfo.w * scale,
        height:  imgageInfo.h * scale
    })
}

const handleModifyPDF = async () => {
    
    globalStore.setIsLoading(true)
    
    const url = globalStore.pdfUrl
    
    // 加載PDF
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    
    // 迴圈處理所有圖片
    for (let i = 0; i < imageStore.images.length; i++) {
        await handleAddImage(imageStore.images[i], pdfDoc)
    }
    imageStore.images = []
    
    // 將PDF轉成二進制或base64
    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true })
    globalStore.pdfUrl = pdfBytes
    
    globalStore.setIsLoading(false)
}

const handleDownloadPDF = async () => {

    await handleModifyPDF()

    const link = document.createElement('a')
    link.href = globalStore.pdfUrl
    link.download = 'signed.pdf'
    link.click()
}

const handleExport = async () => {

    let data = imageStore.images
    data = JSON.parse(JSON.stringify(data))
    
    for (let i = 0; i < data.length; i++) {
        data[i].url = await blobToBase64(data[i].url)
    }

    const jsonData = JSON.stringify(data)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'data.json'
    link.click()
}

const handleImport = async () => {

    const fileInput = document.createElement('input')

    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.onchange = () => {

        const file = fileInput.files[0]
        const reader = new FileReader()

        reader.onload = () => {

            const jsonStr = reader.result
            const jsonObj = JSON.parse(jsonStr)
            
            const res = jsonObj.some( (i) => i.page > pdfRef.value.pageCount)

            if (res === true) alert('PDF不適用此設定檔，請檢查頁數等資訊')
            else Object.assign(imageStore.images, jsonObj)
        }

        reader.readAsText(file)
    }
    fileInput.click()

}

</script>

<template>
<div id="editor">
    <div class="pdf-outer" v-if="globalStore.pdfUrl">
        <div class="pdf-nav">
            <button :disabled="pdfPage === 1" @click="handleChangePage(pdfPage - 1)">-</button>
            <button v-if="pdfRef" :disabled="pdfPage === pdfRef.pageCount" @click="handleChangePage(pdfPage + 1)">+</button>
            <input v-if="pdfRef" type="number" min="1" :max="pdfRef.pageCount"
            :value="pdfPage" :key="test"
            @keydown.enter="handleChangePage($event.target.value)"
            >
            <p v-if="pdfRef"> / {{ pdfRef.pageCount }}</p>
        </div>
        <div class="pdf-content">
            <vue-pdf-embed ref="pdfRef" :source="globalStore.pdfUrl" :page="pdfPage" />
            <div v-for="(item, index) in imageStore.images" :key="index">
                <ImageEditBox v-if="item.page === pdfPage" :index="index" />
            </div>
        </div>
    </div>
    <SignaturePad v-if="isPadOpen" :pdfPage="pdfPage" @handleClosePad="isPadOpen = false" />
    <div class="img-list">
        <div class="img-box" v-for="(item, index) in imageStore.images" :key="index">
            <img :src="item.url" alt="">
            <div style="display: flex; flex-direction: column;">
                <p>page: {{ item.page }}</p>
                <p>width: {{ item.w }}</p>
                <p>height: {{ item.h }}</p>
                <p>x: {{ item.x }}</p>
                <p>y: {{ item.y }}</p>
            </div>
        </div>
    </div>
    <div>
        <button @click="isPadOpen = true">簽名</button>
        <button @click="handleUpload()">上傳圖片</button>
        <button :disabled="isImages" @click="handleDownloadPDF()">下載PDF</button>
        <button :disabled="isImages" @click="handleExport()">匯出設定</button>
        <button @click="handleImport()">匯入設定</button>
    </div>
</div>
</template>

<style lang="scss" scoped>
#editor {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    .pdf-outer {
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
        .pdf-nav {
            display: flex;
            flex-direction: row;
            width: 100%;
            align-items: center;
            input {
                display: block;
                width: 30px;
                height: 25px;
                margin-right: 5px;
                font-size: 16px;
            }
        }
        .pdf-content {
            position: relative;
            width: 100%;
            max-width: 768px;
            overflow: hidden;
        }
    }
}
.signature-container {
    background-color: white;
}
.content-container {
    img {
        display: block;
        width: 100%;
    }
}
.img-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    .img-box {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 400px;
        margin: 5px 0;
        img {
            width: 50%;
        }
        p {
            margin: 0;
        }
    }
}
button {
    margin: 15px;
}
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
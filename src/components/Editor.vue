<script setup>
import { ref, reactive } from 'vue';
import VuePdfEmbed from 'vue-pdf-embed'
import { PDFDocument } from 'pdf-lib'
import Vue3Signature from "vue3-signature"

import { useGlobalStore } from '../store/global.js'
import { useImageStore } from '../store/image.js'

import ImageEditBox from './ImageEditBox.vue'

import { base64ToBlob } from '../utils.js'

const globalStore = useGlobalStore()
const imageStore = useImageStore()

const pdfRef = ref(null)
const pdfPage = ref(1)

const handleChangePdfPage = (n) => {

    pdfPage.value += n
}

// vue-signature
const signatureRef = ref(null)
const signatureState = reactive({
    count: 0,
    option: {
        penColor: "rgb(0, 0, 0)",
        backgroundColor: "rgba(255,255,255, 0)"
    },
    disabled: false
})
const handleApply = async () => {

    const file = signatureRef.value.save('image/png')

    const blobImg = base64ToBlob(file)

    const image = new Image()
    image.src = URL.createObjectURL(blobImg)
    image.onload = () => {
        const width = image.width
        const height = image.height
        console.log(`圖片寬度：${width}，圖片高度：${height}`)
        
        imageStore.images.push({
            url: URL.createObjectURL(blobImg),
            page: pdfPage.value,
            x: 0,
            y: 0,
            w: 300,
            h: 300 / width * height
        })

        signatureRef.value.clear()
    }
}

// 迴圈處理所有圖片
const handleModifyPDF = () => {

    for (let i = 0; i < imageStore.images.length; i++) {
        handleAddImage(imageStore.images[i])
    }
    imageStore.images = []
}

// 將圖片加入PDF
const handleAddImage = async (imgageInfo) => {

    globalStore.setIsLoading(true)

    const url = globalStore.pdfUrl
    const img = imgageInfo.url

    // 加載PDF
  	const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)

    // 取得PDF頁數
    const pages = pdfDoc.getPages()
    const page = pages[imgageInfo.page - 1]

    // 加載圖片
    const pngUrl = img
    const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer())
    
    // 加入圖片
    const pngImage = await pdfDoc.embedPng(pngImageBytes)
    // const pngDims = pngImage.scale(imgInfo.scale)

    const canvasStyle = document.getElementsByTagName('canvas')[0].style

    const canvasWidth = canvasStyle.width.slice(0, -2)
    parseFloat(canvasWidth)

    const canvasHeight = canvasStyle.height.slice(0, -2)
    parseFloat(canvasHeight)

    const scale = page.getWidth() / canvasWidth

    // 圖片放置在PDF上的位置
    page.drawImage(pngImage, {
        x: imgageInfo.x * scale,
        y: (canvasHeight - imgageInfo.y - imgageInfo.h) * scale,
        width:  imgageInfo.w * scale,
        height:  imgageInfo.h * scale
    })

    // 將PDF轉成二進制或base64
    // const pdfBytes = await pdfDoc.save()
    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true })
    globalStore.pdfUrl = pdfBytes

    globalStore.setIsLoading(false)
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

const handleDownload = () => {

    const link = document.createElement('a')
    link.href = globalStore.pdfUrl
    link.download = 'signed.pdf'
    link.click()
}

</script>

<template>
<div id="editor">
    <div class="pdf-outer" v-if="globalStore.pdfUrl">
        <div class="pdf-nav">
            <button :disabled="pdfPage === 1" @click="handleChangePdfPage(-1)">-</button>
            <button v-if="pdfRef" :disabled="pdfPage === pdfRef.pageCount" @click="handleChangePdfPage(1)">+</button>
            <p v-if="pdfRef">{{ pdfPage }} / {{ pdfRef.pageCount }}</p>
        </div>
        <div class="pdf-content">
            <vue-pdf-embed ref="pdfRef" :source="globalStore.pdfUrl" :page="pdfPage" />
            <div v-for="(item, index) in imageStore.images" :key="index">
                <ImageEditBox :index="index" />
            </div>
        </div>
        <div class="signature-container">
            <Vue3Signature 
                ref="signatureRef"
                style="width: 500px; aspect-ratio: 21/9;"
                :sigOption="signatureState.option"
                :disabled="signatureState.disabled" class="signaturel"
            />
        </div>
        <div>
            <div class="signature" style="margin: 5px; border: 1px solid yellow;">
                <button @click="handleApply()">套用簽名</button>
                <button @click="handleModifyPDF()">加入簽名</button>
            </div>
            <div class="uploadImg" style="margin: 5px; border: 1px solid green;">
                <button  @click="handleUpload()">上傳圖片</button>
            </div>
            <div class="pdf" style="margin: 5px; border: 1px solid blue;">
                <button  @click="handleDownload()">下載PDF</button>
            </div>
        </div>
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
        }
        .pdf-content {
            position: relative;
            width: 80%;
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
button {
    margin: 15px;
}
</style>
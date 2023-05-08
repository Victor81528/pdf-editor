<script setup>
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

import { useGlobalStore } from '../store/global.js'
import { useImageStore } from '../store/image.js';

const globalStore = useGlobalStore()
const imageStore = useImageStore()

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

            Object.assign(imageStore.images, jsonObj)
        }

        reader.readAsText(file)
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

    // const canvasStyle = document.getElementsByTagName('canvas')[0].style

    // const canvasWidth = canvasStyle.width.slice(0, -2)
    // parseFloat(canvasWidth)

    // const canvasHeight = canvasStyle.height.slice(0, -2)
    // parseFloat(canvasHeight)

    // const scale = page.getWidth() / canvasWidth

    // 圖片放置在PDF上的位置
    page.drawImage(pngImage, {
        x: imgageInfo.x_percents * page.getWidth(),
        y: (1 - imgageInfo.y_percents - imgageInfo.h_percents) * page.getHeight(),
        width:  imgageInfo.w_percents * page.getWidth(),
        height:  imgageInfo.h_percents * page.getHeight(),
    })
}

const handleModifyPDF = async (url) => {
    
    // 加載PDF
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    
    // 迴圈處理所有圖片
    for (let i = 0; i < imageStore.images.length; i++) {
        await handleAddImage(imageStore.images[i], pdfDoc)
    }

    // 將PDF轉成二進制或base64
    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true })
    return pdfBytes
}

const handleDownloadPDF = async () => {
    
    globalStore.setIsLoading(true)

    for (let i = 0; i < globalStore.pdfs.length; i++) {
        
        const url = await handleModifyPDF(globalStore.pdfs[i].url)
        globalStore.pdfs[i].url = url
    }

    imageStore.images = []
    
    // const link = document.createElement('a')
    // link.href = globalStore.pdfUrl
    // link.download = 'signed.pdf'
    // link.click()
/////////////////////////////////
    const zip = new JSZip()
    // const folder = zip.folder('files')
    for (let i = 0; i < globalStore.pdfs.length; i++) {
        const pdf = globalStore.pdfs[i]
        const pdfData = await fetch(pdf.url).then((res) => res.blob());
        zip.file(pdf.name, pdfData)
    }
    zip.generateAsync({ type: 'blob' }).then((content) => {
        const downloadLink = document.createElement('a')
        downloadLink.href = URL.createObjectURL(content)
        downloadLink.download = 'files.zip'
        downloadLink.click()
    })
/////////////////////////////////

    // const files = globalStore.pdfs.map( i => i.url)

    // // 建立 Blob 物件
    // const blob = new Blob(files, { type: 'application/zip' })

    // // 取得 Blob URL
    // const blobUrl = URL.createObjectURL(blob)

    // // 建立虛擬的下載連結
    // const downloadLink = document.createElement('a')
    // downloadLink.href = blobUrl
    // downloadLink.download = 'files.zip'

    // // 觸發點擊事件下載檔案
    // downloadLink.click()

    // // 釋放 Blob URL 資源
    // URL.revokeObjectURL(blobUrl)

    // globalStore.setIsLoading(false)
}

</script>

<template>
<div id="editor-mutiple">
    <div v-for="(item, index) in globalStore.pdfs" :key="index">
        {{ item.name }}
    </div>
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
    <button @click="handleImport()">選擇設定檔</button>
    <button @click="handleDownloadPDF()">下載PDF</button>
</div>
</template>

<style lang="scss" scoped>
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
</style>
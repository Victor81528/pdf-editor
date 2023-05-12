<script setup>
import { ref, onMounted } from 'vue'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import VuePdfEmbed from 'vue-pdf-embed'
import Swiper, { Navigation, FreeMode } from 'swiper'
import 'swiper/swiper-bundle.min.css'

import { useGlobalStore } from '../store/global.js'
import { useImageStore } from '../store/image.js';

const globalStore = useGlobalStore()
const imageStore = useImageStore()

let swiper = null
const swiperEle = ref(null)
const prevButton = ref(null)
const nextButton = ref(null)
const prevDisallowed = ref(true)
const nextDisallowed = ref(false)
const pdfPage = ref(1)

let imgSwiper = null
const imgSwiperEle = ref(null)
const imgPrevButton = ref(null)
const imgNextButton = ref(null)
const imgPrevDisallowed = ref(true)
const imgNextDisallowed = ref(false)

onMounted(() => {
    swiper = new Swiper(swiperEle.value, {
        modules: [Navigation, FreeMode],
        navigation: {
            prevEl: prevButton.value,
            nextEl: nextButton.value
        },
        slidesPerView: 'auto',
        spaceBetween: 20,
        speed: 500,
        allowTouchMove: true,
        freeMode: true,
        breakpoints: {
            576: {
                slidesPerView: 3
            },
            768: {
                slidesPerView: 4,
                spaceBetween: 20,
                allowTouchMove: false,
                freeMode: true
            },
            1200: {
                slidesPerView: 5,
                spaceBetween: 20,
                allowTouchMove: false,
                freeMode: true
            },
            1400: {
                slidesPerView: 5,
                spaceBetween: 18,
                allowTouchMove: false,
                freeMode: true
            }
        },
        on: {
            reachBeginning: () => {
                prevDisallowed.value = true
            },
            fromEdge: () => {
                prevDisallowed.value = false
                nextDisallowed.value = false
            },
            reachEnd: () => {
                nextDisallowed.value = true
            }
        }
    }),
    imgSwiper = new Swiper(imgSwiperEle.value, {
        modules: [Navigation, FreeMode],
        navigation: {
            prevEl: imgPrevButton.value,
            nextEl: imgNextButton.value
        },
        slidesPerView: 'auto',
        spaceBetween: 20,
        speed: 500,
        allowTouchMove: true,
        freeMode: true,
        breakpoints: {
            576: {
                slidesPerView: 3
            },
            768: {
                slidesPerView: 4,
                spaceBetween: 20,
                allowTouchMove: false,
                freeMode: true
            },
            1200: {
                slidesPerView: 5,
                spaceBetween: 20,
                allowTouchMove: false,
                freeMode: true
            },
            1400: {
                slidesPerView: 5,
                spaceBetween: 18,
                allowTouchMove: false,
                freeMode: true
            }
        },
        on: {
            reachBeginning: () => {
                imgPrevDisallowed.value = true
            },
            fromEdge: () => {
                imgPrevDisallowed.value = false
                imgNextDisallowed.value = false
            },
            reachEnd: () => {
                imgNextDisallowed.value = true
            }
        }
    })
})

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

    const zip = new JSZip()

    for (let i = 0; i < globalStore.pdfs.length; i++) {
        const pdf = globalStore.pdfs[i]
        const pdfData = await fetch(pdf.url).then((res) => res.blob());
        zip.file(pdf.name, pdfData)
    }

    try {
        const content = await zip.generateAsync({ type: 'blob' })
        const downloadLink = document.createElement('a')
        downloadLink.href = URL.createObjectURL(content)
        downloadLink.download = 'files.zip'
        downloadLink.click()
    } catch (err) {
        alert(err)
    }
    globalStore.setIsLoading(false)
}

</script>

<template>
<div id="editor-mutiple">
    <div id="pdf-list" class="swiper" ref="swiperEle">
        <div class="swiper-wrapper">
            <div class="swiper-slide" v-for="(item, index) in globalStore.pdfs" :key="index">
                <div class="pdf-card">
                    <vue-pdf-embed :source="item.url" :page="pdfPage" height="250" />
                    {{ item.name }}
                </div>
            </div>
        </div>
        <div class="swiper-button-prev" ref="prevButton"></div>
        <div class="swiper-button-next" ref="nextButton"></div>
    </div>
    <div id="img-list" class="swiper" ref="imgSwiperEle">
        <div class="swiper-wrapper">
            <div class="swiper-slide" v-for="(item, index) in imageStore.images" :key="index">
                <div class="img-box">
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
        </div>
        <div class="swiper-button-prev" ref="imgPrevButton"></div>
        <div class="swiper-button-next" ref="imgNextButton"></div>
    </div>

    <div class="btns">
        <button @click="handleImport()">選擇設定檔</button>
        <button @click="handleDownloadPDF()">下載PDF</button>
    </div>
</div>
</template>

<style lang="scss" scoped>
#editor-mutiple {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    padding: 20px 0;
    .swiper {
        width: 100%;
        overflow: visible;
        .swiper-slide {
            width: 60%;
            .pdf-card {
                display: flex;
                height: 100%;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
            }
            .img-box {
                display: flex;
                flex-direction: row;
                align-items: center;
                margin: 5px 0;
                img {
                    width: 50%;
                    margin: 10px;
                }
                p {
                    margin: 0;
                }
            }
        }
    }
}
#pdf-list {
    margin: 15px 0;
}
#img-list {
    margin: 15px 0;
}
.btns {
    display: flex;
    width: 100%;
    max-width: 768px;
    justify-content: center;
    margin: 15px 0;
    padding: 0 5px;
    button {
        margin: 0 7.5px;
    }
}
</style>
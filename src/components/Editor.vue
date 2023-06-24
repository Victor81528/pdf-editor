<script setup>
import { ref, computed, onMounted } from 'vue';
import VuePdfEmbed from 'vue-pdf-embed'
import { PDFDocument } from 'pdf-lib'
import Swiper, { Navigation, FreeMode } from 'swiper'
import 'swiper/swiper-bundle.min.css'

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

let imgSwiper = null
const imgSwiperEle = ref(null)
const imgPrevButton = ref(null)
const imgNextButton = ref(null)
const imgPrevDisallowed = ref(true)
const imgNextDisallowed = ref(false)

onMounted(() => {
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
                slidesPerView: 2
            },
            768: {
                slidesPerView: 3,
                spaceBetween: 20,
                allowTouchMove: false,
                freeMode: true
            },
            1200: {
                slidesPerView: 3,
                spaceBetween: 20,
                allowTouchMove: false,
                freeMode: true
            },
            1400: {
                slidesPerView: 3,
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

const canvasWidth = () => {
    const canvasStyle = document.getElementsByTagName('canvas')[0].style
    const canvasWidth = canvasStyle.width.slice(0, -2)
    return parseFloat(canvasWidth)
}
const canvasHeight = () => {
    const canvasStyle = document.getElementsByTagName('canvas')[0].style
    const canvasHeight = canvasStyle.height.slice(0, -2)
    return parseFloat(canvasHeight)
}

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

const handleUploadImage = () => {
    
    const fileInput = document.createElement('input')

    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.onchange = () => {
        const file = fileInput.files[0]

        const img = new Image();
        if (file.type !== 'image/png') {
            const reader = new FileReader();
            reader.onload = (event) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const context = canvas.getContext('2d');
                    context.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        const newFile = new File([blob], `${file.name}.png`, {type: 'image/png'});
                        const image = new Image();
                        image.src = URL.createObjectURL(newFile);
                        image.onload = () => {
                            const width = image.width;
                            const height = image.height;
                            imageStore.images.push({
                                url: image.src,
                                page: pdfPage.value,
                                x: 0,
                                y: 0,
                                w: 300,
                                h: 300 / width * height
                            });
                        }
                    }, 'image/png');
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        } else {
            img.src = URL.createObjectURL(file);
            img.onload = () => {

                const width = img.width;
                const height = img.height;
        
                imageStore.images.push({
                    url: img.src,
                    page: pdfPage.value,
                    x: 0,
                    y: 0,
                    w: 300,
                    h: 300 / width * height
                });
            }
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

    const scale = page.getWidth() / canvasWidth()

    // 圖片放置在PDF上的位置
    page.drawImage(pngImage, {
        x: imgageInfo.x * scale,
        y: (canvasHeight() - imgageInfo.y - imgageInfo.h) * scale,
        width:  imgageInfo.w * scale,
        height:  imgageInfo.h * scale
    })
}

const handleModifyPDF = async () => {
    
    globalStore.setIsLoading(true)
    
    const url = globalStore.pdfs[0].url
    
    // 加載PDF
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    
    // 迴圈處理所有圖片
    for (let i = 0; i < imageStore.images.length; i++) {
        await handleAddImage(imageStore.images[i], pdfDoc)
    }
    // imageStore.images = []

    // 將PDF轉成二進制或base64
    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true })
    globalStore.pdfs[0].url = pdfBytes
    
    globalStore.setIsLoading(false)
}

const handleDownloadPDF = async () => {

    await handleModifyPDF()

    const link = document.createElement('a')
    link.href = globalStore.pdfs[0].url
    link.download = `${globalStore.pdfs[0].name}_signed.pdf`
    link.click()

    location.reload() 
}

const handleExport = async () => {

    let data = imageStore.images
    
    data = JSON.parse(JSON.stringify(data))
    
    for (let i = 0; i < data.length; i++) {
        data[i].url = await blobToBase64(data[i].url)
        data[i].x_percents = data[i].x / canvasWidth()
        data[i].y_percents = data[i].y / canvasHeight()
        data[i].w_percents = data[i].w / canvasWidth()
        data[i].h_percents = data[i].h / canvasHeight()
    }

    const jsonData = JSON.stringify(data)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'data.json'
    link.click()
}

const handleImport = () => {

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
            else {

                Object.assign(imageStore.images, jsonObj)

                for (let i = 0; i < imageStore.images.length; i++) {
                    imageStore.images[i].x = canvasWidth() * imageStore.images[i].x_percents
                    imageStore.images[i].y = canvasHeight() * imageStore.images[i].y_percents
                    imageStore.images[i].w = canvasWidth() * imageStore.images[i].w_percents
                    imageStore.images[i].h = canvasHeight() * imageStore.images[i].h_percents
                }
            }
        }

        reader.readAsText(file)
    }
    fileInput.click()

}

</script>

<template>
<div id="editor">
    <div class="pdf-outer" v-if="globalStore.pdfs[0].url">
        <div class="pdf-nav">
            <div class="page-btn">
                <button :disabled="pdfPage === 1" @click="handleChangePage(pdfPage - 1)">-</button>
                <button v-if="pdfRef" :disabled="pdfPage === pdfRef.pageCount" @click="handleChangePage(pdfPage + 1)">+</button>
            </div>
            <div class="page-input">
                <input v-if="pdfRef" type="number" min="1" :max="pdfRef.pageCount"
                :value="pdfPage" :key="test"
                @keydown.enter="handleChangePage($event.target.value)"
                >
                <p v-if="pdfRef"> / {{ pdfRef.pageCount }}</p>
            </div>
        </div>
        <div class="pdf-content">
            <vue-pdf-embed ref="pdfRef" :source="globalStore.pdfs[0].url" :page="pdfPage" />
            <div v-for="(item, index) in imageStore.images" :key="index">
                <ImageEditBox v-if="item.page === pdfPage" :index="index" />
            </div>
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
    </div>
    <SignaturePad v-if="isPadOpen" :pdfPage="pdfPage" @handleClosePad="isPadOpen = false" />
    <div class="btns">
        <button @click="isPadOpen = true">簽名</button>
        <button @click="handleUploadImage()">上傳圖片</button>
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
    padding: 20px 0;
    .pdf-outer {
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
        .pdf-nav {
            display: flex;
            flex-direction: row;
            width: 100%;
            max-width: 768px;
            justify-content: space-between;
            align-items: center;
            margin: 15px 0;
            .page-btn {
                button {
                    margin: 0;
                    margin-right: 15px;
                }
            }
            .page-input {
                display: flex;
                align-items: center;
                input {
                    display: block;
                    width: 30px;
                    height: 25px;
                    margin-right: 5px;
                    font-size: 16px;
                }
                p {
                    margin: 0;
                }
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
#img-list {
    max-width: 1080px;
    margin: 15px 0;
}
.swiper {
    width: 100%;
    overflow: hidden;
    .swiper-wrapper {
        display: flex;
        align-items: center;
        .swiper-slide {
            width: 60%;
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
.btns {
    display: flex;
    width: 100%;
    max-width: 768px;
    justify-content: space-between;
    margin: 15px 0;
    padding: 0 5px;
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
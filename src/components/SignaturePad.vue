<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useImageStore } from '../store/image.js'
import Vue3Signature from "vue3-signature"

import { base64ToBlob } from '../utils.js'

const props = defineProps(['pdfPage'])
const emit = defineEmits(['handleClosePad'])

const imageStore = useImageStore()

document.body.style.overflow = 'hidden'
onUnmounted(() => {
	document.body.style.overflow = 'auto'
})

const signatureRef = ref(null)
const signatureState = reactive({
    count: 0,
    option: {
        penColor: "rgb(0, 0, 0)",
        backgroundColor: "rgba(255,255,255, 0)"
    },
    disabled: false
})

const handleToImage = async () => {

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
            page: props.pdfPage,
            x: 0,
            y: 0,
            w: 300,
            h: 300 / width * height
        })
    }
    emit('handleClosePad')
}
</script>

<template>
    <div id="signaturePad">
        <div class="signature-container">
            <Vue3Signature 
                ref="signatureRef"
                style="width: 500px; aspect-ratio: 21/9;"
                :sigOption="signatureState.option"
                :disabled="signatureState.disabled"
            />
        </div>
        <div>
            <button @click="handleToImage()">套用簽名</button>
            <button @click="emit('handleClosePad')">取消</button>
        </div>
    </div>

</template>

<style lang="scss" scoped>
#signaturePad {
    display: flex;
	width: 100vw;
	height: 100vh;
	position: fixed;
	top: 0;
    flex-direction: column;
	justify-content: center;
	align-items: center;
	background-color: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(6px);
    z-index: 50;
    .signature-container {
        background-color: white;
    }
}
button {
    margin: 15px;
}
</style>
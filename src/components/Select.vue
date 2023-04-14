<script setup>
import { useGlobalStore } from '../store/global'

const store = useGlobalStore()

const handleUpload = () => {
    
    const fileInput = document.createElement('input')

    fileInput.type = 'file'
    fileInput.accept = '.pdf'
    fileInput.onchange = () => {

        const file = fileInput.files[0]
        store.pdfUrl = URL.createObjectURL(file)
		store.comp = 'Editor'
    }
    fileInput.click()
}

const handleUploadMutiple = () => {

    const fileInput = document.createElement('input')
	fileInput.type = 'file'
	fileInput.accept = '.pdf'
	fileInput.multiple = true
	fileInput.onchange = () => {
		const files = fileInput.files
		const urls = []
		console.log(files);
		for (let i = 0; i < files.length; i++) {
			const file = files[i]
			const url = URL.createObjectURL(file)
			urls.push({name: file.name, url: url})
		}
		store.pdfUrl = urls
		store.comp = 'EditorMultiple'
	}
	fileInput.click()
}

</script>

<template>
	<div id="select">
		<button class="select-section" @click="handleUpload()">選擇PDF</button>
    	<button class="select-section" @click="handleUploadMutiple()">批次處理</button>
	</div>
</template>

<style lang="scss" scoped>
#select {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	min-height: 100vh;
}
.select-section {
	width: 80%;
	max-width: 576px;
	padding: 60px 0;
	margin: 30px;
	box-shadow: 6px 6px 16px rgba(0,0,0,0.3);
}

</style>

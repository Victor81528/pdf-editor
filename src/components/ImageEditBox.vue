<script setup>
import { computed } from 'vue'
import { useImageStore } from '../store/image.js'

import Vue3DraggableResizable from 'vue3-draggable-resizable'
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'

const props = defineProps(['index'])
const imageStore = useImageStore()

const printfn = () => {
	console.log('asdadsa')
	// imageStore.images[props.index].x_percents = imageStore.images[props.index].x / canvasWidth
}

const handleRemove = () => {
	imageStore.images.pop(props.index)
}

</script>

<template>
	<div id="image">
		<Vue3DraggableResizable
			:initW="imageStore.images[props.index].w"
			:initH="imageStore.images[props.index].h"
			v-model:x="imageStore.images[props.index].x"
			v-model:y="imageStore.images[props.index].y"
			v-model:w="imageStore.images[props.index].w"
			v-model:h="imageStore.images[props.index].h"
			:draggable="true"
			:resizable="true"
			:lockAspectRatio="true"
			@activated="printfn()"
			@deactivated="printfn()"
			@drag-start="printfn()"
			@resize-start="printfn()"
			@dragging="printfn()"
			@resizing="printfn()"
			@drag-end="printfn()"
			@resize-end="printfn()"
		>
			<img :src="imageStore.images[props.index].url" alt="">
			<div class="i-box">
				<i class="fa-solid fa-x" @click="handleRemove()"/>
			</div>
		</Vue3DraggableResizable>
	</div>
</template>

<style lang="scss" scoped>
#image {
	display: flex;
	justify-content: center;
	align-items: center;
}
.vdr-container {
	&:hover {
		.i-box {
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
	img {
		object-fit: contain;
		width: 100%;
	}
}
.i-box {
	display: none;
	position: absolute;
	width: 18px;
	height: 18px;
	top: -9px;
	right: 5%;
	background-color: rgb(185, 185, 185);
	border-radius: 3px;
	cursor: pointer;
	&:hover {
		background-color: rgb(204, 204, 204);
	}
}

</style>

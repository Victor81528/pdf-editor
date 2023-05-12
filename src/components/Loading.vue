<script setup>
import { onUnmounted } from 'vue';

document.body.style.overflow = 'hidden'

onUnmounted(() => {
	document.body.style.overflow = 'auto'
})

</script>

<template>
	<div id="loading">
		<!-- <img src="/loading.svg" alt=""> -->
		<div class="loadingio-spinner-rolling">
			<div class="ldio">
				<div></div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
#loading {
	display: flex;
	width: 100vw;
	height: 100vh;
	position: fixed;
	top: 0;
	justify-content: center;
	align-items: center;
	background-color: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(6px);
  z-index: 50;
	img {
		width: 100px;
	}
}

@keyframes ldio {
  0% { transform: translate(-50%,-50%) rotate(0deg); }
  100% { transform: translate(-50%,-50%) rotate(360deg); }
}
.ldio div {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 10px solid #1398df;
  border-top-color: transparent;
  border-radius: 50%;
}
.ldio div {
  animation: ldio 1s linear infinite;
  top: 50px;
  left: 50px
}
.loadingio-spinner-rolling {
  width: 80px;
  height: 80px;
  display: inline-block;
  overflow: hidden;
  background: rgba(241, 242, 243, 0);
}
.ldio {
  width: 100%;
  height: 100%;
  position: relative;
  transform: translateZ(0) scale(0.8);
  backface-visibility: hidden;
  transform-origin: 0 0;
}
.ldio div { box-sizing: content-box; }
</style>

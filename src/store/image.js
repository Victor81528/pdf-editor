import { defineStore } from 'pinia'

export const useImageStore = defineStore('image', {

	state: () => ({
		images: []
	}),
	getters: {
	},
	actions: {
		setIsLoading (boolean) {
			this.isLoading = boolean
		}
	}
})

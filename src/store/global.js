import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {

	state: () => ({
		isLoading: false,
		pdfUrl: null
	}),
	getters: {
		// userCount (state) {
		// 	return state.list.length
		// }
	},
	actions: {
		setIsLoading (boolean) {
			this.isLoading = boolean
		}
	}
})

import Vue from 'vue'
import App from './App.vue'
import './uni.promisify.adaptor'

declare const wx: any;

Vue.config.productionTip = false

// #ifdef MP-WEIXIN
if (typeof wx !== 'undefined' && (wx as any).cloud) {
	(wx as any).cloud.init({
		env: (wx as any).cloud.DYNAMIC_CURRENT_ENV,
		traceUser: true
	});
}
// #endif

const app = new (typeof App === 'function' ? App : Vue.extend(Object.assign({ mpType: 'app' }, App)))
app.$mount();

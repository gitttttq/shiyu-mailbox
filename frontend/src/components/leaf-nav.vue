<template>
	<view class="leaf-nav">
		<view
			v-for="item in items"
			:key="item.path"
			class="leaf-nav-item"
			:class="{ 'leaf-nav-item-active': current === item.path }"
			@tap="go(item.path)"
		>
			<text class="leaf-nav-label">{{ item.label }}</text>
		</view>
	</view>
</template>

<script lang="ts">
import Vue from 'vue';

const items = [
	{ label: '信箱', path: '/pages/index/index' },
	{ label: '捡信', path: '/pages/pick/index' },
	{ label: '写信', path: '/pages/write/index' },
	{ label: '我的', path: '/pages/mine/index' }
];

export default Vue.extend({
	props: {
		current: {
			type: String,
			default: '/pages/index/index'
		}
	},
	data() {
		return {
			items
		};
	},
	methods: {
		go(path: string) {
			if (this.current === path) {
				return;
			}
			uni.redirectTo({ url: path });
		}
	}
});
</script>

<style>
.leaf-nav {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: 24rpx;
	display: flex;
	justify-content: space-between;
	padding: 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 249, 243, 0.92);
	box-shadow: 0 18rpx 38rpx rgba(87, 54, 35, 0.12);
	border: 1rpx solid rgba(126, 84, 49, 0.1);
	backdrop-filter: blur(12rpx);
	z-index: 30;
}

.leaf-nav-item {
	flex: 1;
	height: 72rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.leaf-nav-item-active {
	background: linear-gradient(135deg, #a77b60, #6b4a3b);
	box-shadow: 0 10rpx 22rpx rgba(107, 74, 59, 0.2);
}

.leaf-nav-label {
	font-size: 24rpx;
	color: #775948;
}

.leaf-nav-item-active .leaf-nav-label {
	color: #fff8f2;
}
</style>
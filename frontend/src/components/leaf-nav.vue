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
	{ label: '灵感', path: '/pages/pick/index' },
	{ label: '记录', path: '/pages/write/index' },
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
	padding: 12rpx;
	border-radius: 999rpx;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(239, 249, 255, 0.9)),
		radial-gradient(circle at 16% 0%, rgba(71, 183, 231, 0.22), rgba(71, 183, 231, 0));
	box-shadow: 0 14rpx 30rpx rgba(36, 111, 146, 0.2);
	border: 1rpx solid rgba(66, 148, 191, 0.24);
	backdrop-filter: blur(10rpx);
	z-index: 30;
}

.leaf-nav-item {
	flex: 1;
	height: 78rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 220ms ease;
}

.leaf-nav-item-active {
	background: linear-gradient(135deg, #26baf2, #3a8fff);
	box-shadow: 0 10rpx 22rpx rgba(31, 111, 182, 0.34);
}

.leaf-nav-label {
	font-size: 24rpx;
	font-weight: 700;
	letter-spacing: 2rpx;
	color: #286f95;
}

.leaf-nav-item-active .leaf-nav-label {
	color: #fff7ef;
}
</style>
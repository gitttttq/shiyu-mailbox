<template>
	<view class="page-shell">
		<view class="hero-card">
			<view class="hero-topline">PICK A LETTER</view>
			<view class="hero-title">从树下，捡起另一颗正在轻轻发热的心</view>
			<view class="hero-copy">这里的每封信都来自另一个真实的人。也许你无法认识 ta，但你可以接住那一刻的情绪。</view>
		</view>

		<view class="letter-card" v-if="post">
			<view class="letter-meta">
				<text>{{ post.mood }}</text>
				<text>{{ post.pickedCount }} 次拾起</text>
			</view>
			<view class="letter-title">{{ post.title }}</view>
			<view class="letter-content">{{ post.content }}</view>
			<view class="letter-author">{{ post.nickname }}</view>
			<view class="action-row">
				<view class="ghost-button" @tap="loadRandomPost">换一封</view>
				<view class="solid-button" @tap="handlePick">轻轻拾起</view>
			</view>
		</view>

		<view v-else class="empty-card">
			<view class="empty-title">现在还没有可捡起的心事</view>
			<view class="empty-copy">可能大家都还在写，或者你已经看完了今天能遇见的缘分。</view>
			<view class="solid-button full" @tap="loadRandomPost">再试一次</view>
		</view>

		<leaf-nav current="/pages/pick/index" />
	</view>
</template>

<script lang="ts">
import Vue from 'vue';
import LeafNav from '@/components/leaf-nav.vue';
import { fetchRandomPost, pickPost, TreeholePost } from '@/utils/treehole';

export default Vue.extend({
	components: { LeafNav },
	data() {
		return {
			post: null as TreeholePost | null,
			loading: false
		};
	},
	onShow() {
		this.loadRandomPost();
	},
	methods: {
		async loadRandomPost() {
			this.loading = true;
			try {
				const data = await fetchRandomPost();
				this.post = data.post;
			} catch (error) {
				uni.showToast({ title: (error as Error).message, icon: 'none' });
			} finally {
				this.loading = false;
			}
		},
		async handlePick() {
			if (!this.post) {
				return;
			}
			try {
				const data = await pickPost(this.post.id);
				uni.showToast({ title: '已经替你收好', icon: 'success' });
				this.post = data.post;
			} catch (error) {
				uni.showToast({ title: (error as Error).message, icon: 'none' });
			}
		}
	}
});
</script>

<style>
page {
	background: radial-gradient(circle at top, #f8f0e6 0%, #eddccd 42%, #dcc0aa 100%);
}

.page-shell {
	min-height: 100vh;
	padding: 28rpx 28rpx 138rpx;
	box-sizing: border-box;
}

.hero-card,
.letter-card,
.empty-card {
	border-radius: 32rpx;
	background: rgba(255, 249, 243, 0.84);
	border: 1rpx solid rgba(126, 84, 49, 0.11);
	box-shadow: 0 22rpx 54rpx rgba(88, 54, 33, 0.1);
}

.hero-card {
	padding: 40rpx 32rpx;
	background: linear-gradient(160deg, rgba(255, 250, 245, 0.96), rgba(240, 224, 208, 0.92));
}

.hero-topline {
	font-size: 20rpx;
	letter-spacing: 6rpx;
	color: #8a6d5b;
}

.hero-title {
	margin-top: 18rpx;
	font-size: 50rpx;
	line-height: 1.35;
	font-weight: 600;
	color: #4d3529;
}

.hero-copy {
	margin-top: 20rpx;
	font-size: 28rpx;
	line-height: 1.85;
	color: #74594a;
}

.letter-card,
.empty-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.letter-meta {
	display: flex;
	justify-content: space-between;
	font-size: 22rpx;
	color: #9b7d6c;
}

.letter-title {
	margin-top: 14rpx;
	font-size: 34rpx;
	font-weight: 600;
	color: #50382c;
}

.letter-content {
	margin-top: 18rpx;
	font-size: 28rpx;
	line-height: 1.95;
	color: #6d5344;
}

.letter-author {
	margin-top: 18rpx;
	font-size: 22rpx;
	color: #967969;
}

.action-row {
	display: flex;
	justify-content: space-between;
	margin-top: 30rpx;
}

.empty-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #53392c;
}

.empty-copy {
	margin-top: 18rpx;
	font-size: 26rpx;
	line-height: 1.85;
	color: #785c4e;
}

.ghost-button,
.solid-button {
	height: 88rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
}

.ghost-button {
	width: 48%;
	color: #765946;
	background: rgba(255, 255, 255, 0.55);
	border: 1rpx solid rgba(118, 89, 70, 0.14);
}

.solid-button {
	width: 48%;
	color: #fff9f5;
	background: linear-gradient(135deg, #a87d60, #6d4a3c);
	box-shadow: 0 16rpx 32rpx rgba(109, 74, 60, 0.24);
}

.solid-button.full {
	width: 100%;
	margin-top: 26rpx;
}
</style>
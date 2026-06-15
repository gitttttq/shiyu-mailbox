<template>
	<view class="page-shell">
		<view class="hero-card">
			<view class="hero-topline">MY LETTERBOX</view>
			<view class="hero-title">我的心事，会在这里留下自己的年轮</view>
			<view class="hero-copy">你可以查看自己的投稿状态，也可以从这里进入后台管理页。</view>
		</view>

		<view class="profile-card">
			<view class="field-label">我的署名</view>
			<input v-model="nickname" class="text-input" maxlength="20" placeholder="给自己起一个名字" />
			<view class="action-row">
				<view class="ghost-button" @tap="saveProfile">保存署名</view>
				<view class="solid-button" @tap="goAdmin">后台管理</view>
			</view>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">我的投稿</text>
				<text class="section-tag">{{ posts.length }} 封</text>
			</view>
			<view v-if="loading" class="empty-text">正在翻找你的旧信...</view>
			<view v-else-if="!posts.length" class="empty-text">你还没有投稿，去写下第一封心事吧。</view>
			<view v-else>
				<view v-for="post in posts" :key="post.id" class="letter-card">
					<view class="letter-meta">
						<text>{{ post.mood }}</text>
						<text :class="['status-badge', 'status-' + post.status]">{{ statusText(post.status) }}</text>
					</view>
					<view class="letter-title">{{ post.title }}</view>
					<view class="letter-content">{{ post.content }}</view>
				</view>
			</view>
		</view>

		<leaf-nav current="/pages/mine/index" />
	</view>
</template>

<script lang="ts">
import Vue from 'vue';
import LeafNav from '@/components/leaf-nav.vue';
import { fetchMyPosts, getNickname, saveNickname, TreeholePost } from '@/utils/treehole';

export default Vue.extend({
	components: { LeafNav },
	data() {
		return {
			nickname: getNickname(),
			posts: [] as TreeholePost[],
			loading: false
		};
	},
	onShow() {
		this.loadPage();
	},
	methods: {
		async loadPage() {
			this.loading = true;
			try {
				const data = await fetchMyPosts();
				this.posts = data.posts;
				if (data.user && data.user.nickname) {
					this.nickname = data.user.nickname;
					saveNickname(data.user.nickname);
				}
			} catch (error) {
				uni.showToast({ title: (error as Error).message, icon: 'none' });
			} finally {
				this.loading = false;
			}
		},
		saveProfile() {
			saveNickname(this.nickname);
			uni.showToast({ title: '署名已保存', icon: 'success' });
		},
		goAdmin() {
			uni.navigateTo({ url: '/pages/admin/index' });
		},
		statusText(status: string) {
			if (status === 'approved') {
				return '已通过';
			}
			if (status === 'hidden') {
				return '已隐藏';
			}
			return '待审核';
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
.profile-card,
.section-card {
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

.profile-card,
.section-card {
	margin-top: 22rpx;
	padding: 28rpx;
}

.field-label,
.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #53392c;
}

.text-input {
	width: 100%;
	box-sizing: border-box;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.72);
	padding: 22rpx 24rpx;
	font-size: 26rpx;
	color: #5d4436;
	border: 1rpx solid rgba(126, 84, 49, 0.08);
	margin-top: 16rpx;
}

.action-row {
	display: flex;
	justify-content: space-between;
	margin-top: 22rpx;
}

.section-head,
.letter-meta {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.section-tag,
.empty-text,
.letter-content {
	color: #7d6250;
}

.section-tag,
.letter-meta,
.status-badge,
.empty-text {
	font-size: 22rpx;
}

.letter-card {
	padding: 24rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.66);
	border: 1rpx solid rgba(126, 84, 49, 0.08);
	margin-top: 16rpx;
}

.letter-title {
	margin-top: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	color: #50382c;
}

.letter-content {
	margin-top: 14rpx;
	font-size: 25rpx;
	line-height: 1.8;
}

.status-badge {
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.6);
}

.status-approved {
	color: #567449;
}

.status-pending {
	color: #9a6c3f;
}

.status-hidden {
	color: #8a6565;
}

.ghost-button,
.solid-button {
	width: 48%;
	height: 88rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
}

.ghost-button {
	color: #765946;
	background: rgba(255, 255, 255, 0.55);
	border: 1rpx solid rgba(118, 89, 70, 0.14);
}

.solid-button {
	color: #fff9f5;
	background: linear-gradient(135deg, #a87d60, #6d4a3c);
	box-shadow: 0 16rpx 32rpx rgba(109, 74, 60, 0.24);
}
</style>
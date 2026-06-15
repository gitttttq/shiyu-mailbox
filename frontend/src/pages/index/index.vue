<template>
	<view class="page-shell">
		<view class="hero-card">
			<view class="hero-topline">TREEHOLE LETTERS</view>
			<view class="hero-title">让无法当面说出口的话，有一个温柔落地的地方</view>
			<view class="hero-copy">
				你可以把自己的心事投递进来，也可以从树下捡起别人的一封来信。每段情绪都值得被认真对待。
			</view>
			<view class="hero-actions">
				<view class="ghost-button" @tap="goPick">去捡一封信</view>
				<view class="solid-button" @tap="goWrite">写下心事</view>
			</view>
		</view>

		<view class="stats-grid">
			<view class="stat-card">
				<view class="stat-value">{{ stats.users }}</view>
				<view class="stat-label">留下痕迹的人</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ stats.approvedPosts }}</view>
				<view class="stat-label">封公开心事</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ stats.pickedCount }}</view>
				<view class="stat-label">次被温柔接住</view>
			</view>
		</view>

		<view class="section-card" v-if="featuredPost">
			<view class="section-head">
				<text class="section-title">今日树洞</text>
				<text class="section-tag">{{ featuredPost.mood }}</text>
			</view>
			<view class="featured-title">{{ featuredPost.title }}</view>
			<view class="featured-copy">{{ featuredPost.content }}</view>
			<view class="featured-footer">
				<text>{{ featuredPost.nickname }}</text>
				<text>{{ featuredPost.createdAt }}</text>
			</view>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">情绪风向</text>
				<text class="section-link" @tap="loadPage">刷新</text>
			</view>
			<view class="mood-row">
				<view v-for="item in moodSummary" :key="item.label" class="mood-pill">
					{{ item.label }} · {{ item.count }}
				</view>
			</view>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">最近被看见的心事</text>
				<text class="section-tag">{{ posts.length }} 封</text>
			</view>
			<view v-if="loading" class="empty-text">正在轻轻翻开信箱...</view>
			<view v-else-if="!posts.length" class="empty-text">还没有公开心事，成为第一个投递的人吧。</view>
			<view v-else>
				<view v-for="post in posts" :key="post.id" class="letter-card" @tap="openPost(post)">
					<view class="letter-meta">
						<text>{{ post.mood }}</text>
						<text>{{ post.pickedCount }} 次拾起</text>
					</view>
					<view class="letter-title">{{ post.title }}</view>
					<view class="letter-content">{{ post.content }}</view>
					<view class="letter-author">{{ post.nickname }}</view>
				</view>
			</view>
		</view>

		<leaf-nav current="/pages/index/index" />
	</view>
</template>

<script lang="ts">
import Vue from 'vue';
import LeafNav from '@/components/leaf-nav.vue';
import { fetchHomeData, TreeholePost } from '@/utils/treehole';

export default Vue.extend({
	components: {
		LeafNav
	},
	data() {
		return {
			loading: false,
			stats: {
				users: 0,
				approvedPosts: 0,
				pendingPosts: 0,
				pickedCount: 0,
				moods: {} as Record<string, number>
			},
			posts: [] as TreeholePost[]
		};
	},
	computed: {
		featuredPost(): TreeholePost | null {
			return this.posts.length ? this.posts[0] : null;
		},
		moodSummary(): Array<{ label: string; count: number }> {
			return Object.keys(this.stats.moods).map((key: string) => ({
				label: key,
				count: this.stats.moods[key]
			}));
		}
	},
	onShow() {
		this.loadPage();
	},
	methods: {
		async loadPage() {
			this.loading = true;
			try {
				const data = await fetchHomeData();
				this.stats = data.stats;
				this.posts = data.posts;
			} catch (error) {
				uni.showToast({
					title: (error as Error).message,
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},
		goWrite() {
			uni.redirectTo({ url: '/pages/write/index' });
		},
		goPick() {
			uni.redirectTo({ url: '/pages/pick/index' });
		},
		openPost(post: TreeholePost) {
			uni.showModal({
				title: post.title,
				content: post.content + '\n\n—— ' + post.nickname,
				showCancel: false,
				confirmText: '收好'
			});
		}
	}
});
</script>

<style>
page {
	background: radial-gradient(circle at top, #f8f0e6 0%, #eddccd 42%, #dcc0aa 100%);
	min-height: 100%;
}

.page-shell {
	min-height: 100vh;
	padding: 28rpx 28rpx 138rpx;
	box-sizing: border-box;
}

.hero-card,
.section-card,
.stat-card {
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
	font-size: 52rpx;
	line-height: 1.35;
	font-weight: 600;
	color: #4d3529;
}

.hero-copy {
	margin-top: 22rpx;
	font-size: 28rpx;
	line-height: 1.85;
	color: #74594a;
}

.hero-actions {
	display: flex;
	justify-content: space-between;
	margin-top: 30rpx;
}

.stats-grid {
	display: flex;
	justify-content: space-between;
	margin-top: 22rpx;
}

.stat-card {
	width: 31.5%;
	padding: 26rpx 20rpx;
	box-sizing: border-box;
}

.stat-value {
	font-size: 42rpx;
	font-weight: 600;
	color: #563a2d;
}

.stat-label {
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: #8c705f;
}

.section-card {
	margin-top: 22rpx;
	padding: 28rpx;
}

.section-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 18rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #53392c;
}

.section-tag,
.section-link {
	font-size: 22rpx;
	color: #9a7662;
}

.featured-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #4e372a;
}

.featured-copy {
	margin-top: 18rpx;
	font-size: 28rpx;
	line-height: 1.85;
	color: #6f5446;
}

.featured-footer {
	display: flex;
	justify-content: space-between;
	margin-top: 20rpx;
	font-size: 22rpx;
	color: #967867;
}

.mood-row {
	display: flex;
	flex-wrap: wrap;
	margin-right: -12rpx;
}

.mood-pill {
	margin: 0 12rpx 12rpx 0;
	padding: 14rpx 24rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.58);
	font-size: 24rpx;
	color: #7b604e;
}

.letter-card {
	padding: 24rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.66);
	border: 1rpx solid rgba(126, 84, 49, 0.08);
	margin-bottom: 16rpx;
}

.letter-card:last-child {
	margin-bottom: 0;
}

.letter-meta {
	display: flex;
	justify-content: space-between;
	font-size: 22rpx;
	color: #9b7d6c;
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
	color: #6d5344;
}

.letter-author {
	margin-top: 14rpx;
	font-size: 22rpx;
	color: #967969;
}

.empty-text {
	padding: 36rpx 0 18rpx;
	font-size: 25rpx;
	text-align: center;
	color: #9b806f;
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

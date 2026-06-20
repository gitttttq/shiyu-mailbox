<template>
	<view class="page-shell">
		<view class="ambient ambient-halo"></view>
		<view class="ambient ambient-grain"></view>

		<view class="hero-card reveal-1">
			<view class="hero-top">
				<text class="hero-mark">SHIYU LETTERHOUSE</text>
				<text class="hero-date">{{ todayText }}</text>
			</view>
			<view class="hero-title">每一种没说出口的情绪，都值得被郑重收藏。</view>
			<view class="hero-subtitle">
				这是你的私人记录空间。
				写给自己，留给今天，也留给未来回看的你。
			</view>
			<view class="hero-actions">
				<view class="btn-ghost" @tap="goPick">查看灵感卡片</view>
				<view class="btn-solid" @tap="goWrite">写下一条记录</view>
			</view>
		</view>

		<view class="metrics-card reveal-2">
			<view class="metric-item">
				<view class="metric-value">{{ stats.users }}</view>
				<view class="metric-label">记录空间</view>
			</view>
			<view class="metric-item">
				<view class="metric-value">{{ stats.approvedPosts }}</view>
				<view class="metric-label">我的记录数</view>
			</view>
			<view class="metric-item">
				<view class="metric-value">{{ stats.pickedCount }}</view>
				<view class="metric-label">累计字数/100</view>
			</view>
		</view>

		<view class="section-card reveal-3" v-if="featuredPost">
			<view class="section-head">
				<text class="section-title">最近一条记录</text>
				<text class="mood-tag">{{ featuredPost.mood }}</text>
			</view>
			<view class="featured-title">{{ featuredPost.title }}</view>
			<view class="featured-body">{{ featuredPost.content }}</view>
			<view class="featured-foot">
				<text>—— {{ featuredPost.nickname }}</text>
				<text>{{ formatDate(featuredPost.createdAt) }}</text>
			</view>
		</view>

		<view class="section-card reveal-4">
			<view class="section-head">
				<text class="section-title">我的情绪分布</text>
				<text class="section-link" @tap="loadPage">刷新谱面</text>
			</view>
			<view v-if="moodSummary.length" class="mood-list">
				<view v-for="item in moodSummary" :key="item.label" class="mood-chip">
					<text>{{ item.label }}</text>
					<text class="mood-count">{{ item.count }}</text>
				</view>
			</view>
			<view v-else class="empty-text">还没有记录，先去写下第一条吧。</view>
		</view>

		<view class="section-card reveal-5">
			<view class="section-head">
				<text class="section-title">最近记录</text>
				<text class="section-meta">{{ posts.length }} 封</text>
			</view>
			<view v-if="loading" class="empty-text">正在读取本地记录...</view>
			<view v-else-if="!posts.length" class="empty-text">暂时还没有记录，去写下第一段内容吧。</view>
			<view v-else>
				<view v-for="post in posts" :key="post.id" class="letter-card" @tap="openPost(post)">
					<view class="letter-top">
						<text>{{ post.mood }}</text>
						<text>{{ formatDate(post.createdAt) }}</text>
					</view>
					<view class="letter-title">{{ post.title }}</view>
					<view class="letter-body">{{ post.content }}</view>
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

type LocalNote = {
	id: string;
	nickname: string;
	title: string;
	mood: string;
	content: string;
	createdAt: string;
};

const STORAGE_NOTES_KEY = 'shiyu-local-notes';

export default Vue.extend({
	components: {
		LeafNav
	},
	data() {
		return {
			loading: false,
			stats: {
				users: 1,
				approvedPosts: 0,
				pendingPosts: 0,
				pickedCount: 0,
				moods: {} as Record<string, number>
			},
			posts: [] as LocalNote[]
		};
	},
	computed: {
		todayText(): string {
			const now = new Date();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			return now.getFullYear() + '.' + month + '.' + day;
		},
		featuredPost(): LocalNote | null {
			return this.posts.length ? this.posts[0] : null;
		},
		moodSummary(): Array<{ label: string; count: number }> {
			return Object.keys(this.stats.moods)
				.map((key: string) => ({
					label: key,
					count: this.stats.moods[key]
				}))
				.sort((a, b) => b.count - a.count);
		}
	},
	onShow() {
		this.loadPage();
	},
	methods: {
		readLocalNotes(): LocalNote[] {
			const value = uni.getStorageSync(STORAGE_NOTES_KEY);
			if (Array.isArray(value)) {
				return value as LocalNote[];
			}
			return [];
		},
		formatDate(value: string) {
			if (!value) {
				return '';
			}
			return value.slice(0, 10);
		},
		loadPage() {
			this.loading = true;
			const notes = this.readLocalNotes().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
			const moods: Record<string, number> = {};
			let contentLength = 0;
			notes.forEach((note) => {
				moods[note.mood] = (moods[note.mood] || 0) + 1;
				contentLength += (note.content || '').length;
			});
			this.posts = notes;
			this.stats = {
				users: 1,
				approvedPosts: notes.length,
				pendingPosts: 0,
				pickedCount: Math.floor(contentLength / 100),
				moods
			};
			this.loading = false;
		},
		goWrite() {
			uni.redirectTo({ url: '/pages/write/index' });
		},
		goPick() {
			uni.redirectTo({ url: '/pages/pick/index' });
		},
		openPost(post: LocalNote) {
			uni.showModal({
				title: post.title,
				content: post.content + '\n\n—— ' + post.nickname,
				showCancel: false,
				confirmText: '记住了'
			});
		}
	}
});
</script>

<style>
page {
	background:
		radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0) 34%),
		radial-gradient(circle at 88% 6%, rgba(117, 222, 255, 0.26) 0%, rgba(117, 222, 255, 0) 32%),
		radial-gradient(circle at 14% 42%, rgba(255, 190, 128, 0.28) 0%, rgba(255, 190, 128, 0) 36%),
		linear-gradient(160deg, #f1fbff 0%, #e9f7ff 40%, #fdf4ea 100%);
	min-height: 100%;
}

.page-shell {
	position: relative;
	overflow: hidden;
	min-height: 100vh;
	padding: 28rpx 28rpx 146rpx;
	box-sizing: border-box;
	--ink-strong: #183143;
	--ink-normal: #33556d;
	--ink-soft: #5f7e95;
	--line-soft: rgba(53, 109, 143, 0.2);
}

.ambient {
	position: absolute;
	pointer-events: none;
	z-index: 0;
}

.ambient-halo {
	top: 90rpx;
	left: -80rpx;
	width: 390rpx;
	height: 390rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(74, 193, 240, 0.26), rgba(74, 193, 240, 0));
	animation: haloMove 12s ease-in-out infinite alternate;
}

.ambient-grain {
	right: -140rpx;
	bottom: 220rpx;
	width: 460rpx;
	height: 460rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(255, 181, 112, 0.24), rgba(255, 181, 112, 0));
	animation: haloMove 15s ease-in-out infinite alternate-reverse;
}

.hero-card,
.metrics-card,
.section-card {
	position: relative;
	z-index: 1;
	border-radius: 34rpx;
	border: 1rpx solid var(--line-soft);
	background: rgba(255, 255, 255, 0.82);
	box-shadow: 0 10rpx 24rpx rgba(28, 88, 119, 0.12), 0 24rpx 52rpx rgba(34, 98, 129, 0.1);
	backdrop-filter: blur(6rpx);
}

.hero-card {
	padding: 40rpx 34rpx;
	background:
		linear-gradient(155deg, rgba(255, 255, 255, 0.96), rgba(237, 249, 255, 0.9)),
		radial-gradient(circle at 90% 12%, rgba(88, 198, 241, 0.24), rgba(88, 198, 241, 0));
	border-radius: 42rpx;
}

.hero-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.hero-mark {
	font-size: 20rpx;
	letter-spacing: 5rpx;
	color: #2f85b0;
	font-weight: 700;
}

.hero-date {
	font-size: 22rpx;
	color: #3e8fb7;
	font-weight: 700;
}

.hero-title {
	margin-top: 22rpx;
	font-size: 62rpx;
	line-height: 1.22;
	font-weight: 700;
	color: var(--ink-strong);
	font-family: "Avenir Next", "PingFang SC", "Helvetica Neue", sans-serif;
	letter-spacing: 1rpx;
}

.hero-subtitle {
	margin-top: 22rpx;
	font-size: 28rpx;
	line-height: 1.8;
	color: var(--ink-normal);
}

.hero-actions {
	margin-top: 30rpx;
	display: flex;
	gap: 16rpx;
}

.btn-ghost,
.btn-solid {
	flex: 1;
	height: 90rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 700;
	letter-spacing: 1rpx;
}

.btn-ghost {
	background: rgba(255, 255, 255, 0.84);
	border: 1rpx solid rgba(64, 149, 193, 0.3);
	color: #266f95;
}

.btn-solid {
	background: linear-gradient(130deg, #22b8f3, #3a8dff);
	color: #fff6ef;
	box-shadow: 0 14rpx 26rpx rgba(37, 123, 189, 0.34);
}

.metrics-card {
	margin-top: 24rpx;
	padding: 24rpx 18rpx;
	display: flex;
	gap: 10rpx;
}

.metric-item {
	flex: 1;
	text-align: center;
	padding: 14rpx 0;
	border-right: 1rpx solid rgba(122, 82, 60, 0.18);
}

.metric-item:last-child {
	border-right: 0;
}

.metric-value {
	font-size: 52rpx;
	font-weight: 700;
	color: #1f4c66;
}

.metric-label {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: var(--ink-soft);
}

.section-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.section-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 18rpx;
}

.section-title {
	font-size: 34rpx;
	font-weight: 700;
	color: var(--ink-strong);
	font-family: "STSong", "SimSun", serif;
}

.section-link,
.section-meta {
	font-size: 23rpx;
	color: #2f86b1;
	font-weight: 700;
}

.mood-tag {
	font-size: 23rpx;
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.78);
	border: 1rpx solid rgba(60, 147, 191, 0.24);
	color: #2f7fa8;
}

.featured-title {
	font-size: 36rpx;
	font-weight: 700;
	line-height: 1.35;
	color: #45291f;
}

.featured-body {
	margin-top: 16rpx;
	font-size: 28rpx;
	line-height: 1.8;
	color: var(--ink-normal);
}

.featured-foot {
	margin-top: 18rpx;
	display: flex;
	justify-content: space-between;
	font-size: 22rpx;
	color: #916b5a;
}

.mood-list {
	display: flex;
	flex-wrap: wrap;
	margin-right: -12rpx;
}

.mood-chip {
	margin: 0 12rpx 12rpx 0;
	padding: 12rpx 22rpx;
	border-radius: 999rpx;
	border: 1rpx solid rgba(66, 150, 193, 0.22);
	background: rgba(255, 255, 255, 0.8);
	color: #24698e;
	font-size: 24rpx;
	display: inline-flex;
	gap: 14rpx;
}

.mood-count {
	font-weight: 700;
}

.letter-card {
	padding: 24rpx;
	border-radius: 24rpx;
	margin-bottom: 14rpx;
	border: 1rpx solid rgba(66, 150, 193, 0.22);
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(237, 248, 255, 0.78)),
		repeating-linear-gradient(0deg, rgba(88, 178, 218, 0.06) 0, rgba(88, 178, 218, 0.06) 2rpx, transparent 2rpx, transparent 14rpx);
}

.letter-card:last-child {
	margin-bottom: 0;
}

.letter-top {
	display: flex;
	justify-content: space-between;
	font-size: 22rpx;
	color: #906a58;
}

.letter-title {
	margin-top: 12rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #1f465f;
}

.letter-body {
	margin-top: 12rpx;
	font-size: 26rpx;
	line-height: 1.75;
	color: #3c6077;
}

.letter-author {
	margin-top: 14rpx;
	font-size: 22rpx;
	color: #8c695a;
}

.empty-text {
	padding: 20rpx 0 10rpx;
	text-align: center;
	font-size: 25rpx;
	line-height: 1.7;
	color: #8e6753;
}

.reveal-1,
.reveal-2,
.reveal-3,
.reveal-4,
.reveal-5 {
	animation: revealUp 560ms ease-out both;
}

.reveal-2 {
	animation-delay: 80ms;
}

.reveal-3 {
	animation-delay: 140ms;
}

.reveal-4 {
	animation-delay: 220ms;
}

.reveal-5 {
	animation-delay: 300ms;
}

@keyframes haloMove {
	from {
		transform: translate3d(0, 0, 0) scale(1);
	}
	to {
		transform: translate3d(0, -30rpx, 0) scale(1.08);
	}
}

@keyframes revealUp {
	from {
		opacity: 0;
		transform: translate3d(0, 20rpx, 0);
	}
	to {
		opacity: 1;
		transform: translate3d(0, 0, 0);
	}
}
</style>

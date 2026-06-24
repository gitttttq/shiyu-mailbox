<template>
	<view class="page-shell">
		<view class="ambient ambient-halo"></view>
		<view class="ambient ambient-shadow"></view>

		<view class="hero-card reveal-1">
			<view class="hero-mark">MY SPACE</view>
			<view class="hero-title">我的记录空间</view>
			<view class="hero-copy">
				这是你的私人记录档案，仅在当前设备可见。
			</view>
		</view>

		<view class="stats-card reveal-2" v-if="stats.totalCount > 0">
			<view class="stats-title">我的记录之旅</view>
			<view class="stats-grid">
				<view class="stat-item">
					<view class="stat-value">{{ stats.totalCount }}</view>
					<view class="stat-label">总记录数</view>
				</view>
				<view class="stat-item">
					<view class="stat-value">{{ stats.daysUsed }}</view>
					<view class="stat-label">使用天数</view>
				</view>
				<view class="stat-item">
					<view class="stat-value">{{ stats.totalWords }}</view>
					<view class="stat-label">累计字数</view>
				</view>
			</view>
			<view class="stats-detail" v-if="stats.firstDate">
				<text>第一篇记录：{{ stats.firstDate }}</text>
				<text>最爱情绪：{{ stats.topMood || '暂无' }}</text>
			</view>
		</view>

		<view class="profile-card reveal-3">
			<view class="field-label">我的署名</view>
			<input
				v-model="nickname"
				class="text-input"
				placeholder-class="text-input-placeholder"
				maxlength="20"
				placeholder="给自己取一个温柔名字"
			/>
			<view class="field-hint">署名会显示在你的记录中，可以随时修改。</view>
			<view class="action-row">
				<view class="ghost-button ghost-button-full" @tap="saveProfile">保存署名</view>
			</view>
		</view>

		<view class="section-card reveal-4">
			<view class="section-head">
				<text class="section-title">我的记录</text>
				<text class="section-tag">{{ posts.length }} 封</text>
			</view>
			<view v-if="loading" class="empty-text">正在读取你的本地记录...</view>
			<view v-else-if="!posts.length" class="empty-text">你还没有记录，去写下第一条吧。</view>
			<view v-else>
				<view v-for="post in posts" :key="post.id" class="letter-card">
					<view class="letter-meta">
						<text class="mood-tag">{{ post.mood }}</text>
						<text class="date-text">{{ formatDate(post.createdAt) }}</text>
					</view>
					<view class="letter-title">{{ post.title }}</view>
					<view class="letter-content">{{ post.content }}</view>
				</view>
			</view>
		</view>

		<view class="profile-card reveal-5" v-if="isAdmin">
			<view class="action-row" style="margin-top: 16rpx;">
				<view class="ghost-button ghost-button-full" @tap="goAdmin">进入管理后台</view>
			</view>
		</view>

		<leaf-nav current="/pages/mine/index" />
	</view>
</template>

<script lang="ts">
import Vue from 'vue';
import LeafNav from '@/components/leaf-nav.vue';
import { fetchViewerIdentity, getNickname, saveNickname } from '@/utils/treehole';

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
	components: { LeafNav },
	data() {
		return {
			nickname: getNickname(),
			posts: [] as LocalNote[],
			loading: false,
			isAdmin: false
		};
	},
	computed: {
		stats(): { totalCount: number; daysUsed: number; totalWords: number; firstDate: string; topMood: string } {
			if (!this.posts.length) {
				return { totalCount: 0, daysUsed: 0, totalWords: 0, firstDate: '', topMood: '' };
			}
			const sorted = [...this.posts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
			const firstDate = sorted[0].createdAt.slice(0, 10);
			const now = new Date();
			const first = new Date(firstDate);
			const daysUsed = Math.floor((now.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)) + 1;
			const totalWords = this.posts.reduce((sum, p) => sum + (p.content || '').length, 0);
			const moodCount: Record<string, number> = {};
			this.posts.forEach(p => {
				moodCount[p.mood] = (moodCount[p.mood] || 0) + 1;
			});
			const topMood = Object.keys(moodCount).sort((a, b) => moodCount[b] - moodCount[a])[0] || '';
			return {
				totalCount: this.posts.length,
				daysUsed,
				totalWords,
				firstDate,
				topMood
			};
		}
	},
	onShow() {
		this.loadPage();
		this.loadViewer();
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
			this.posts = this.readLocalNotes().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
			this.loading = false;
		},
		saveProfile() {
			saveNickname(this.nickname);
			uni.showToast({ title: '署名已保存', icon: 'success' });
		},
		async loadViewer() {
			try {
				const viewer = await fetchViewerIdentity();
				this.isAdmin = !!viewer.isAdmin;
			} catch (error) {
				this.isAdmin = false;
			}
		},
		goAdmin() {
			uni.navigateTo({ url: '/pages/admin/index' });
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
}

.page-shell {
	position: relative;
	overflow: hidden;
	min-height: 100vh;
	padding: 28rpx 28rpx 146rpx;
	box-sizing: border-box;
}

.ambient {
	position: absolute;
	pointer-events: none;
	z-index: 0;
}

.ambient-halo {
	top: 170rpx;
	right: -120rpx;
	width: 340rpx;
	height: 340rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(74, 193, 240, 0.26), rgba(74, 193, 240, 0));
	animation: drift 12s ease-in-out infinite alternate;
}


.ambient-shadow {
	top: 820rpx;
	left: -120rpx;
	width: 320rpx;
	height: 320rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(255, 181, 112, 0.24), rgba(255, 181, 112, 0));
	animation: drift 15s ease-in-out infinite alternate-reverse;
}

.hero-card,
.profile-card,
.section-card {
	position: relative;
	z-index: 1;
	border-radius: 36rpx;
	background: rgba(255, 255, 255, 0.82);
	border: 1rpx solid rgba(53, 109, 143, 0.2);
	box-shadow: 0 10rpx 24rpx rgba(28, 88, 119, 0.12), 0 24rpx 52rpx rgba(34, 98, 129, 0.1);
	backdrop-filter: blur(4rpx);
}

.hero-card {
	padding: 42rpx 34rpx;
	background:
		linear-gradient(155deg, rgba(255, 255, 255, 0.96), rgba(237, 249, 255, 0.9)),
		radial-gradient(circle at 90% 12%, rgba(88, 198, 241, 0.24), rgba(88, 198, 241, 0));
}

.hero-mark {
	font-size: 20rpx;
	letter-spacing: 5rpx;
	color: #2f85b0;
	font-weight: 700;
}

.hero-title {
	margin-top: 20rpx;
	font-size: 56rpx;
	line-height: 1.24;
	font-weight: 700;
	color: #183143;
	letter-spacing: 1rpx;
	font-family: "Avenir Next", "PingFang SC", "Helvetica Neue", sans-serif;
}

.hero-copy {
	margin-top: 22rpx;
	font-size: 28rpx;
	line-height: 1.75;
	color: #3a6179;
}

.profile-card,
.section-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.field-label,
.section-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #1e4963;
	font-family: "Avenir Next", "PingFang SC", "Helvetica Neue", sans-serif;
}

.text-input {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	box-sizing: border-box;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.94);
	padding: 0 30rpx;
	font-size: 30rpx;
	font-weight: 500;
	color: #2a546e;
	border: 2rpx solid rgba(66, 150, 193, 0.24);
	margin-top: 16rpx;
}

.text-input-placeholder {
	color: #9f7861;
	font-size: 28rpx;
}

.field-hint {
	margin-top: 12rpx;
	font-size: 22rpx;
	line-height: 1.55;
	color: #906c57;
}

.action-row {
	display: flex;
	gap: 16rpx;
	margin-top: 24rpx;
}

.section-head,
.letter-meta {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.mood-tag {
	font-size: 22rpx;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.76);
	border: 1rpx solid rgba(66, 150, 193, 0.22);
	color: #2f7fa8;
}

.section-tag,
.empty-text,
.letter-content {
	color: #6f5041;
}

.section-tag,
.letter-meta,
.status-badge,
.empty-text {
	font-size: 23rpx;
}

.letter-card {
	padding: 24rpx 24rpx 26rpx;
	border-radius: 24rpx;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(237, 248, 255, 0.78)),
		repeating-linear-gradient(0deg, rgba(88, 178, 218, 0.06) 0, rgba(88, 178, 218, 0.06) 2rpx, transparent 2rpx, transparent 14rpx);
	border: 1rpx solid rgba(66, 150, 193, 0.22);
	box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
	margin-top: 16rpx;
}

.letter-title {
	margin-top: 14rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #1f465f;
}

.letter-content {
	margin-top: 14rpx;
	font-size: 26rpx;
	line-height: 1.75;
}

.status-badge {
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.82);
	font-weight: 600;
}

.status-approved {
	color: #3f6943;
}

.status-pending {
	color: #875f30;
}

.status-hidden {
	color: #7f5e5e;
}

.ghost-button,
.solid-button {
	flex: 1;
	height: 90rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 700;
}

.ghost-button {
	color: #266f95;
	background: rgba(255, 255, 255, 0.84);
	border: 1rpx solid rgba(64, 149, 193, 0.3);
}

.ghost-button-full {
	flex: 0 0 100%;
}

.solid-button {
	color: #fff8f2;
	background: linear-gradient(130deg, #22b8f3, #3a8dff);
	box-shadow: 0 14rpx 26rpx rgba(37, 123, 189, 0.34);
}

.empty-text {
	margin-top: 20rpx;
	line-height: 1.7;
}

@keyframes drift {
	from {
		transform: translate3d(0, 0, 0) scale(1);
	}
	to {
		transform: translate3d(0, -26rpx, 0) scale(1.08);
	}
}

.reveal-1,
.reveal-2,
.reveal-3 {
	animation: revealUp 560ms ease-out both;
}

.reveal-2 {
	animation-delay: 100ms;
}

.reveal-3 {
	animation-delay: 180ms;
}

@keyframes revealUp {
	from {
		opacity: 0;
		transform: translate3d(0, 18rpx, 0);
	}
	to {
		opacity: 1;
		transform: translate3d(0, 0, 0);
	}
}
</style>
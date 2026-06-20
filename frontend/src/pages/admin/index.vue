<template>
	<view class="page-shell">
		<view class="ambient ambient-aurora"></view>
		<view class="ambient ambient-blur"></view>
		<view class="hero-card">
			<view class="hero-seal">只在此处校对温柔</view>
			<view class="hero-topline">ADMIN STUDIO</view>
			<view class="hero-title">后台管理</view>
			<view class="hero-copy">在这里审核所有树洞留言，查看用户活跃情况。默认管理口令是 shiyu-admin-2026，可在云函数环境变量中覆盖。</view>
		</view>

		<view class="login-card">
			<view class="field-label">管理员口令</view>
			<input v-model="adminKey" class="text-input" password maxlength="40" placeholder="输入管理口令" />
			<view class="solid-button full" @tap="loadAll">进入后台</view>
		</view>

		<view v-if="authorized" class="stats-grid">
			<view class="stat-card">
				<view class="stat-value">{{ overview.users }}</view>
				<view class="stat-label">用户</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ overview.posts }}</view>
				<view class="stat-label">留言</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ overview.pending }}</view>
				<view class="stat-label">待审核</view>
			</view>
		</view>

		<view v-if="authorized" class="section-card">
			<view class="section-head">
				<text class="section-title">审核留言</text>
				<text class="section-link" @tap="loadPosts">刷新</text>
			</view>
			<input v-model="keyword" class="text-input" placeholder="搜索标题、内容、署名" />
			<view class="filter-row">
				<view
					v-for="item in statuses"
					:key="item"
					class="filter-pill"
					:class="{ 'filter-pill-active': status === item }"
					@tap="changeStatus(item)"
				>
					{{ item }}
				</view>
			</view>
			<view v-for="post in posts" :key="post.id" class="post-card">
				<view class="post-meta">
					<text>{{ post.nickname }} · {{ post.mood }}</text>
					<text>{{ post.status }}</text>
				</view>
				<view class="post-title">{{ post.title }}</view>
				<view class="post-content">{{ post.content }}</view>
				<view class="post-actions">
					<view class="mini-button approve" @tap="updateStatus(post.id, 'approved')">通过</view>
					<view class="mini-button pending" @tap="updateStatus(post.id, 'pending')">待定</view>
					<view class="mini-button hide" @tap="updateStatus(post.id, 'hidden')">隐藏</view>
				</view>
			</view>
		</view>

		<view v-if="authorized" class="section-card users-card">
			<view class="section-head">
				<text class="section-title">用户概况</text>
				<text class="section-link" @tap="loadUsers">刷新</text>
			</view>
			<view v-for="user in users" :key="user.openid" class="user-row">
				<view>
					<view class="user-name">{{ user.nickname }}</view>
					<view class="user-meta">{{ user.postCount }} 投稿 · {{ user.pendingCount }} 待审</view>
				</view>
				<view class="user-meta">{{ user.lastActiveAt }}</view>
			</view>
		</view>
	</view>
</template>

<script lang="ts">
import Vue from 'vue';
import {
	fetchAdminOverview,
	fetchAdminPosts,
	fetchAdminUsers,
	getAdminKey,
	saveAdminKey,
	TreeholePost,
	TreeholeUser,
	updateAdminPostStatus
} from '@/utils/treehole';

export default Vue.extend({
	data() {
		return {
			adminKey: getAdminKey(),
			authorized: false,
			overview: {
				users: 0,
				posts: 0,
				approved: 0,
				pending: 0,
				hidden: 0
			},
			statuses: ['all', 'pending', 'approved', 'hidden'],
			status: 'pending',
			keyword: '',
			posts: [] as TreeholePost[],
			users: [] as TreeholeUser[]
		};
	},
	methods: {
		async loadAll() {
			try {
				saveAdminKey(this.adminKey);
				const overview = await fetchAdminOverview(this.adminKey);
				this.overview = overview.totals;
				this.authorized = true;
				await Promise.all([this.loadPosts(), this.loadUsers()]);
			} catch (error) {
				this.authorized = false;
				uni.showToast({ title: (error as Error).message, icon: 'none' });
			}
		},
		async loadPosts() {
			if (!this.authorized) {
				return;
			}
			try {
				const data = await fetchAdminPosts({
					key: this.adminKey,
					status: this.status,
					mood: 'all',
					keyword: this.keyword
				});
				this.posts = data.posts;
			} catch (error) {
				uni.showToast({ title: (error as Error).message, icon: 'none' });
			}
		},
		async loadUsers() {
			if (!this.authorized) {
				return;
			}
			try {
				const data = await fetchAdminUsers(this.adminKey);
				this.users = data.users;
			} catch (error) {
				uni.showToast({ title: (error as Error).message, icon: 'none' });
			}
		},
		changeStatus(status: string) {
			this.status = status;
			this.loadPosts();
		},
		async updateStatus(postId: string, status: 'pending' | 'approved' | 'hidden') {
			try {
				await updateAdminPostStatus(this.adminKey, postId, status);
				uni.showToast({ title: '状态已更新', icon: 'success' });
				await Promise.all([this.loadAll()]);
			} catch (error) {
				uni.showToast({ title: (error as Error).message, icon: 'none' });
			}
		}
	}
});
</script>

<style>
page {
	background:
		radial-gradient(circle at 6% 10%, rgba(255, 239, 221, 0.92) 0%, rgba(255, 239, 221, 0) 34%),
		radial-gradient(circle at 98% 4%, rgba(215, 171, 137, 0.34) 0%, rgba(215, 171, 137, 0) 32%),
		linear-gradient(165deg, #f4e4d2 0%, #ebd4bf 42%, #e3c4ac 100%);
}

.page-shell {
	position: relative;
	overflow: hidden;
	min-height: 100vh;
	padding: 28rpx 28rpx 48rpx;
	box-sizing: border-box;
}

.ambient {
	position: absolute;
	pointer-events: none;
	z-index: 0;
}

.ambient-aurora {
	top: 160rpx;
	right: -120rpx;
	width: 340rpx;
	height: 340rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(211, 131, 98, 0.2), rgba(211, 131, 98, 0));
	animation: drift 10s ease-in-out infinite alternate;
}

.ambient-blur {
	top: 760rpx;
	left: -120rpx;
	width: 320rpx;
	height: 320rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(112, 84, 62, 0.16), rgba(112, 84, 62, 0));
	animation: drift 12s ease-in-out infinite alternate-reverse;
}

.hero-card,
.login-card,
.section-card,
.stat-card {
	position: relative;
	z-index: 1;
	border-radius: 32rpx;
	background: rgba(255, 249, 241, 0.84);
	border: 1rpx solid rgba(108, 70, 48, 0.13);
	box-shadow: 0 26rpx 62rpx rgba(88, 54, 33, 0.12);
	backdrop-filter: blur(4rpx);
}

.hero-card {
	padding: 40rpx 32rpx;
	background:
		linear-gradient(150deg, rgba(255, 251, 245, 0.98), rgba(246, 226, 203, 0.9)),
		radial-gradient(circle at 92% 12%, rgba(182, 117, 84, 0.2), rgba(182, 117, 84, 0));
}

.hero-seal {
	display: inline-flex;
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	font-size: 21rpx;
	letter-spacing: 2rpx;
	color: #7b4f3d;
	background: rgba(255, 255, 255, 0.7);
	border: 1rpx solid rgba(144, 97, 68, 0.18);
}

.hero-topline {
	margin-top: 20rpx;
	font-size: 20rpx;
	letter-spacing: 9rpx;
	color: #946f5a;
}

.hero-title {
	margin-top: 18rpx;
	font-size: 58rpx;
	font-weight: 600;
	color: #4a2d23;
	font-family: "STKaiti", "KaiTi", serif;
}

.hero-copy {
	margin-top: 18rpx;
	font-size: 26rpx;
	line-height: 1.8;
	color: #704f3f;
}

.login-card,
.section-card {
	margin-top: 22rpx;
	padding: 28rpx;
}

.field-label,
.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #4a2f24;
	font-family: "STKaiti", "KaiTi", serif;
}

.text-input {
	width: 100%;
	box-sizing: border-box;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.72);
	padding: 22rpx 24rpx;
	font-size: 26rpx;
	color: #55392c;
	border: 1rpx solid rgba(126, 84, 49, 0.16);
	margin-top: 16rpx;
}

.solid-button.full {
	margin-top: 22rpx;
	width: 100%;
	height: 88rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	color: #fff9f5;
	background: linear-gradient(135deg, #c48260, #7f4433);
}

.stats-grid {
	display: flex;
	justify-content: space-between;
	margin-top: 22rpx;
}

.stat-card {
	width: 31.5%;
	padding: 24rpx 20rpx;
	box-sizing: border-box;
}

.stat-value {
	font-size: 42rpx;
	font-weight: 600;
	color: #4a2f24;
}

.stat-label {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #866756;
}

.section-head,
.post-meta,
.user-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.section-link,
.post-meta,
.user-meta {
	font-size: 22rpx;
	color: #936d58;
}

.filter-row {
	display: flex;
	flex-wrap: wrap;
	margin-top: 16rpx;
	margin-right: -12rpx;
}

.filter-pill {
	margin: 0 12rpx 12rpx 0;
	padding: 14rpx 22rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
	color: #6d4c3b;
	background: rgba(255, 255, 255, 0.58);
}

.filter-pill-active {
	color: #fff8f2;
	background: linear-gradient(135deg, #c48260, #7f4433);
}

.post-card {
	margin-top: 18rpx;
	padding: 24rpx;
	border-radius: 24rpx;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 249, 244, 0.66)),
		repeating-linear-gradient(0deg, rgba(154, 121, 95, 0.05) 0, rgba(154, 121, 95, 0.05) 2rpx, transparent 2rpx, transparent 14rpx);
	border: 1rpx solid rgba(126, 84, 49, 0.16);
}

.post-title,
.user-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #482e23;
}

.post-content {
	margin-top: 12rpx;
	font-size: 25rpx;
	line-height: 1.8;
	color: #644638;
}

.post-actions {
	display: flex;
	justify-content: space-between;
	margin-top: 20rpx;
}

.mini-button {
	width: 31%;
	height: 68rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
}

.approve {
	background: rgba(97, 143, 90, 0.14);
	color: #4d6b43;
}

.pending {
	background: rgba(193, 143, 62, 0.14);
	color: #8d6630;
}

.hide {
	background: rgba(147, 105, 105, 0.14);
	color: #8b6666;
}

.users-card {
	margin-bottom: 40rpx;
}

.user-row {
	padding: 18rpx 0;
	border-bottom: 1rpx solid rgba(126, 84, 49, 0.12);
}

.user-row:last-child {
	border-bottom: 0;
	padding-bottom: 0;
}

@keyframes drift {
	from {
		transform: translate3d(0, 0, 0) scale(1);
	}
	to {
		transform: translate3d(0, -26rpx, 0) scale(1.08);
	}
}
</style>
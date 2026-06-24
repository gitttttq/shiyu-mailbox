<template>
	<view class="page-shell">
		<view class="ambient ambient-aurora"></view>
		<view class="ambient ambient-blur"></view>
		<view class="hero-card">
			<view class="hero-mark">ADMIN STUDIO</view>
			<view class="hero-title">管理后台</view>
			<view class="hero-copy">在这里审核所有留言，查看用户活跃情况。</view>
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
		radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0) 34%),
		radial-gradient(circle at 88% 6%, rgba(117, 222, 255, 0.26) 0%, rgba(117, 222, 255, 0) 32%),
		radial-gradient(circle at 14% 42%, rgba(255, 190, 128, 0.28) 0%, rgba(255, 190, 128, 0) 36%),
		linear-gradient(160deg, #f1fbff 0%, #e9f7ff 40%, #fdf4ea 100%);
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
	top: 200rpx;
	right: -100rpx;
	width: 320rpx;
	height: 320rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(74, 193, 240, 0.26), rgba(74, 193, 240, 0));
	animation: drift 12s ease-in-out infinite alternate;
}

.ambient-blur {
	top: 920rpx;
	left: -120rpx;
	width: 300rpx;
	height: 300rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(255, 181, 112, 0.24), rgba(255, 181, 112, 0));
	animation: drift 15s ease-in-out infinite alternate-reverse;
}

.hero-card,
.login-card,
.section-card,
.stat-card {
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

.login-card,
.section-card {
	margin-top: 22rpx;
	padding: 28rpx;
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

.solid-button.full {
	margin-top: 22rpx;
	width: 100%;
	height: 88rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	color: #fff;
	background: linear-gradient(135deg, #4ac3f0, #2f85b0);
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
	font-weight: 700;
	color: #183143;
}

.stat-label {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #3a6179;
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
	color: #3a6179;
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
	color: #2f7fa8;
	background: rgba(255, 255, 255, 0.76);
	border: 1rpx solid rgba(66, 150, 193, 0.22);
}

.filter-pill-active {
	color: #fff;
	background: linear-gradient(135deg, #4ac3f0, #2f85b0);
	border-color: transparent;
}

.post-card {
	margin-top: 18rpx;
	padding: 24rpx;
	border-radius: 24rpx;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(237, 248, 255, 0.78)),
		repeating-linear-gradient(0deg, rgba(88, 178, 218, 0.06) 0, rgba(88, 178, 218, 0.06) 2rpx, transparent 2rpx, transparent 14rpx);
	border: 1rpx solid rgba(66, 150, 193, 0.22);
	box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
}

.post-title,
.user-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #183143;
}

.post-content {
	margin-top: 12rpx;
	font-size: 26rpx;
	line-height: 1.75;
	color: #3a6179;
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
	background: rgba(74, 193, 240, 0.14);
	color: #2f85b0;
}

.pending {
	background: rgba(255, 181, 112, 0.14);
	color: #c48260;
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
	border-bottom: 1rpx solid rgba(66, 150, 193, 0.12);
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
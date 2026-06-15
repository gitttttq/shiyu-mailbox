<template>
	<view class="page-shell">
		<view class="hero-card">
			<view class="hero-topline">ADMIN STUDIO</view>
			<view class="hero-title">后台管理</view>
			<view class="hero-copy">在这里审核所有树洞留言，查看用户活跃情况。默认管理口令是 shiyu-admin-2026，请在后端 .env 文件中修改。</view>
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
	background: radial-gradient(circle at top, #f8f0e6 0%, #eddccd 42%, #dcc0aa 100%);
}

.page-shell {
	min-height: 100vh;
	padding: 28rpx 28rpx 48rpx;
	box-sizing: border-box;
}

.hero-card,
.login-card,
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
	font-size: 48rpx;
	font-weight: 600;
	color: #4d3529;
}

.hero-copy {
	margin-top: 18rpx;
	font-size: 26rpx;
	line-height: 1.8;
	color: #74594a;
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
	background: linear-gradient(135deg, #a87d60, #6d4a3c);
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
	color: #563a2d;
}

.stat-label {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #8c705f;
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
	color: #9a7662;
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
	color: #7b604e;
	background: rgba(255, 255, 255, 0.58);
}

.filter-pill-active {
	color: #fff8f2;
	background: linear-gradient(135deg, #a77b60, #6b4a3b);
}

.post-card {
	margin-top: 18rpx;
	padding: 24rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.66);
	border: 1rpx solid rgba(126, 84, 49, 0.08);
}

.post-title,
.user-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #50382c;
}

.post-content {
	margin-top: 12rpx;
	font-size: 25rpx;
	line-height: 1.8;
	color: #6d5344;
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
	border-bottom: 1rpx solid rgba(126, 84, 49, 0.08);
}

.user-row:last-child {
	border-bottom: 0;
	padding-bottom: 0;
}
</style>
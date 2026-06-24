<template>
	<view class="page-shell">
		<view class="ambient ambient-halo"></view>
		<view class="ambient ambient-shadow"></view>

		<view class="hero-card reveal-1">
			<view class="hero-mark">WRITING ROOM</view>
			<view class="hero-title">把今天的想法写下来，只留给自己看。</view>
			<view class="hero-copy">
				这是你的私人记录空间，不公开、不分享，仅用于日常整理与回看。
			</view>
		</view>

		<view class="inspiration-banner reveal-2" v-if="inspirationTitle">
			<view class="banner-label">灵感提示</view>
			<view class="banner-title">{{ inspirationTitle }}</view>
			<view class="banner-content">{{ inspirationContent }}</view>
		</view>

		<view class="form-card reveal-2">
			<view class="field-label">落款署名</view>
			<view class="field-shell">
				<input
					v-model="form.nickname"
					class="text-input"
					maxlength="20"
					placeholder="例如：风起时"
					placeholder-class="input-placeholder"
				/>
			</view>

			<view class="field-label">信件题目</view>
			<view class="field-shell">
				<input
					v-model="form.title"
					class="text-input"
					maxlength="40"
					placeholder="给这条记录起一个标题"
					placeholder-class="input-placeholder"
				/>
			</view>

			<view class="field-label">此刻情绪</view>
			<view class="mood-row">
				<view
					v-for="mood in moods"
					:key="mood"
					class="mood-pill"
					:class="{ 'mood-pill-active': form.mood === mood }"
					@tap="form.mood = mood"
				>
					{{ mood }}
				</view>
			</view>

			<view class="field-label">记录正文</view>
			<view class="textarea-shell">
				<textarea
					v-model="form.content"
					class="textarea-input"
					maxlength="300"
					placeholder="记录今天的想法、待办或灵感。"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view class="count-row">{{ form.content.length }}/300</view>

			<view class="tips-box">
				内容仅保存在你的当前设备，不会公开展示。
			</view>
			<view class="submit-btn" @tap="submitPost">保存这条记录</view>
		</view>

		<leaf-nav current="/pages/write/index" />
	</view>
</template>

<script lang="ts">
import Vue from 'vue';
import LeafNav from '@/components/leaf-nav.vue';
import { createPost, getNickname, saveNickname } from '@/utils/treehole';
import { MOODS, generateRandomNickname } from '@/config/constants';

const STORAGE_NOTES_KEY = 'shiyu-local-notes';

type LocalNote = {
	id: string;
	nickname: string;
	title: string;
	mood: string;
	content: string;
	createdAt: string;
};

export default Vue.extend({
	components: { LeafNav },
	data() {
		return {
			moods: MOODS as unknown as string[],
			form: {
				nickname: getNickname() || generateRandomNickname(),
				title: '',
				mood: MOODS[0] as string,
				content: ''
			},
			submitting: false,
			inspirationTitle: '',
			inspirationContent: '',
			inspirationMood: '' as string
		};
	},
	onLoad(options: any) {
		// 接收从灵感卡片传来的参数
		if (options && options.inspirationTitle) {
			this.inspirationTitle = decodeURIComponent(options.inspirationTitle);
			this.inspirationContent = decodeURIComponent(options.inspirationContent || '');
			this.inspirationMood = decodeURIComponent(options.inspirationMood || '');
			// 预填表单
			this.form.title = this.inspirationTitle;
			if (this.inspirationMood && (MOODS as readonly string[]).includes(this.inspirationMood)) {
				(this.form as any).mood = this.inspirationMood;
			}
		}
	},
	methods: {
		readLocalNotes(): LocalNote[] {
			const value = uni.getStorageSync(STORAGE_NOTES_KEY);
			if (Array.isArray(value)) {
				return value as LocalNote[];
			}
			return [];
		},
		async submitPost() {
			if (this.submitting) {
				return;
			}
			if (!this.form.title.trim()) {
				uni.showToast({ title: '请填写标题', icon: 'none' });
				return;
			}
			if (!this.form.content.trim()) {
				uni.showToast({ title: '请填写内容', icon: 'none' });
				return;
			}
			this.submitting = true;
			try {
				saveNickname(this.form.nickname);
				// 本地存储
				const notes = this.readLocalNotes();
				notes.unshift({
					id: 'note_' + Date.now().toString(36),
					nickname: this.form.nickname || '我',
					title: this.form.title.trim(),
					mood: this.form.mood,
					content: this.form.content.trim(),
					createdAt: new Date().toISOString()
				});
				uni.setStorageSync(STORAGE_NOTES_KEY, notes);
				// 同步到云端
				try {
					await createPost({
						nickname: this.form.nickname || '我',
						title: this.form.title.trim(),
						mood: this.form.mood,
						content: this.form.content.trim()
					});
				} catch (cloudError) {
					console.warn('云端同步失败，已保留本地记录', cloudError);
				}
				uni.showToast({ title: '已保存', icon: 'success' });
				this.form.title = '';
				this.form.content = '';
				setTimeout(() => {
					uni.redirectTo({ url: '/pages/mine/index' });
				}, 500);
			} catch (error) {
				uni.showToast({ title: (error as Error).message, icon: 'none' });
			} finally {
				this.submitting = false;
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
	padding: 28rpx 28rpx 146rpx;
	box-sizing: border-box;
}

.ambient {
	position: absolute;
	pointer-events: none;
	z-index: 0;
}

.ambient-halo {
	top: 200rpx;
	right: -100rpx;
	width: 320rpx;
	height: 320rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(74, 193, 240, 0.26), rgba(74, 193, 240, 0));
	animation: drift 12s ease-in-out infinite alternate;
}


.ambient-shadow {
	top: 920rpx;
	left: -120rpx;
	width: 300rpx;
	height: 300rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(255, 181, 112, 0.24), rgba(255, 181, 112, 0));
	animation: drift 15s ease-in-out infinite alternate-reverse;
}

.hero-card,
.form-card,
.inspiration-banner {
	position: relative;
	z-index: 1;
	border-radius: 36rpx;
	background: rgba(255, 255, 255, 0.82);
	border: 1rpx solid rgba(53, 109, 143, 0.2);
	box-shadow: 0 10rpx 24rpx rgba(28, 88, 119, 0.12), 0 24rpx 52rpx rgba(34, 98, 129, 0.1);
	backdrop-filter: blur(4rpx);
}

.inspiration-banner {
	margin-top: 24rpx;
	padding: 30rpx;
	background:
		linear-gradient(155deg, rgba(255, 255, 255, 0.96), rgba(237, 249, 255, 0.9)),
		radial-gradient(circle at 90% 12%, rgba(88, 198, 241, 0.24), rgba(88, 198, 241, 0));
}

.banner-label {
	font-size: 20rpx;
	letter-spacing: 5rpx;
	color: #2f85b0;
	font-weight: 700;
}

.banner-title {
	margin-top: 16rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #183143;
	line-height: 1.35;
}

.banner-content {
	margin-top: 14rpx;
	font-size: 28rpx;
	line-height: 1.75;
	color: #3a6179;
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
	font-size: 58rpx;
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

.form-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.field-label {
	margin-top: 20rpx;
	margin-bottom: 12rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #1e4963;
	font-family: "Avenir Next", "PingFang SC", "Helvetica Neue", sans-serif;
}

.field-label:first-child {
	margin-top: 0;
}

.field-shell {
	height: 88rpx;
	box-sizing: border-box;
	padding: 0 28rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.82));
	border: 2rpx solid rgba(66, 150, 193, 0.24);
	box-shadow: inset 0 2rpx 10rpx rgba(109, 74, 60, 0.05), 0 6rpx 14rpx rgba(115, 71, 48, 0.08);
}

.text-input {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	background: transparent;
	border: none;
	outline: none;
	font-size: 30rpx;
	font-weight: 500;
	color: #2a546e;
}

.textarea-shell {
	height: 340rpx;
	box-sizing: border-box;
	padding: 22rpx 26rpx;
	border-radius: 20rpx;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.82));
	border: 2rpx solid rgba(66, 150, 193, 0.24);
	box-shadow: inset 0 2rpx 10rpx rgba(109, 74, 60, 0.05), 0 8rpx 18rpx rgba(115, 71, 48, 0.08);
}

.textarea-input {
	width: 100%;
	height: 100%;
	background: transparent;
	font-size: 29rpx;
	line-height: 1.7;
	color: #2a546e;
}

.input-placeholder {
	color: #9f7861;
	font-size: 28rpx;
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
	background: rgba(255, 255, 255, 0.76);
	font-size: 24rpx;
	font-weight: 600;
	color: #24698e;
	border: 1rpx solid rgba(66, 150, 193, 0.22);
}

.mood-pill-active {
	color: #fff8f2;
	background: linear-gradient(130deg, #22b8f3, #3a8dff);
}

.count-row {
	margin-top: 14rpx;
	font-size: 23rpx;
	font-weight: 600;
	text-align: right;
	color: #946e5a;
}

.tips-box {
	margin-top: 20rpx;
	padding: 18rpx 20rpx;
	border-radius: 16rpx;
	font-size: 23rpx;
	line-height: 1.6;
	color: #376581;
	background: rgba(255, 255, 255, 0.62);
	border: 1rpx solid rgba(66, 150, 193, 0.22);
}

.submit-btn {
	margin-top: 26rpx;
	width: 100%;
	height: 90rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 700;
	color: #fff8f2;
	background: linear-gradient(130deg, #22b8f3, #3a8dff);
	box-shadow: 0 14rpx 26rpx rgba(37, 123, 189, 0.34);
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
.reveal-2 {
	animation: revealUp 560ms ease-out both;
}

.reveal-2 {
	animation-delay: 120ms;
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

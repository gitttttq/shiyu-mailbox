<template>
	<view class="page-shell">
		<view class="hero-card">
			<view class="hero-topline">WRITE TO THE TREEHOLE</view>
			<view class="hero-title">把今天想说的话，交给一张不会打断你的纸</view>
			<view class="hero-copy">所有新投稿会先进入待审核，审核通过后才会出现在公共树洞里。</view>
		</view>

		<view class="form-card">
			<view class="field-label">署名</view>
			<view class="field-shell">
				<input
					v-model="form.nickname"
					class="text-input"
					maxlength="20"
					placeholder="给自己起一个温柔的名字"
					placeholder-class="input-placeholder"
				/>
			</view>

			<view class="field-label">标题</view>
			<view class="field-shell">
				<input
					v-model="form.title"
					class="text-input"
					maxlength="40"
					placeholder="给这封心事取一个题目"
					placeholder-class="input-placeholder"
				/>
			</view>

			<view class="field-label">情绪</view>
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

			<view class="field-label">内容</view>
			<view class="textarea-shell">
				<textarea
					v-model="form.content"
					class="textarea-input"
					maxlength="300"
					placeholder="在这里写下你的心事、疑问、想念，或者只是今天没有说出口的那一句。"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view class="count-row">{{ form.content.length }}/300</view>
			<view class="solid-button full" @tap="submitPost">投进树洞</view>
		</view>

		<leaf-nav current="/pages/write/index" />
	</view>
</template>

<script lang="ts">
import Vue from 'vue';
import LeafNav from '@/components/leaf-nav.vue';
import { createPost, getNickname } from '@/utils/treehole';

export default Vue.extend({
	components: { LeafNav },
	data() {
		return {
			moods: ['想念', '治愈', '勇气', '晚安', '遗憾', '秘密'],
			form: {
				nickname: getNickname(),
				title: '',
				mood: '想念',
				content: ''
			},
			submitting: false
		};
	},
	methods: {
		async submitPost() {
			if (this.submitting) {
				return;
			}
			this.submitting = true;
			try {
				await createPost(this.form);
				uni.showToast({ title: '已投进树洞', icon: 'success' });
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
	background: radial-gradient(circle at top, #f8f0e6 0%, #eddccd 42%, #dcc0aa 100%);
}

.page-shell {
	min-height: 100vh;
	padding: 28rpx 28rpx 138rpx;
	box-sizing: border-box;
}

.hero-card,
.form-card {
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

.form-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.field-label {
	margin-top: 18rpx;
	margin-bottom: 12rpx;
	font-size: 26rpx;
	font-weight: 600;
	color: #52382c;
}

.field-label:first-child {
	margin-top: 0;
}

.field-shell {
	height: 88rpx;
	box-sizing: border-box;
	padding: 0 24rpx;
	border-radius: 20rpx;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.82));
	border: 2rpx solid rgba(142, 102, 73, 0.14);
	box-shadow: inset 0 2rpx 10rpx rgba(109, 74, 60, 0.05);
}

.text-input {
	width: 100%;
	height: 88rpx;
	background: transparent;
	border: none;
	outline: none;
	font-size: 28rpx;
	color: #5a4032;
}

.textarea-shell {
	height: 320rpx;
	box-sizing: border-box;
	padding: 20rpx 24rpx;
	border-radius: 20rpx;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.82));
	border: 2rpx solid rgba(142, 102, 73, 0.14);
	box-shadow: inset 0 2rpx 10rpx rgba(109, 74, 60, 0.05);
}

.textarea-input {
	width: 100%;
	height: 100%;
	background: transparent;
	font-size: 28rpx;
	line-height: 1.7;
	color: #5a4032;
}

.input-placeholder {
	color: #a18f82;
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
	background: rgba(255, 255, 255, 0.58);
	font-size: 24rpx;
	color: #7b604e;
}

.mood-pill-active {
	color: #fff8f2;
	background: linear-gradient(135deg, #a77b60, #6b4a3b);
}

.count-row {
	margin-top: 14rpx;
	font-size: 22rpx;
	text-align: right;
	color: #9b7d6c;
}

.solid-button.full {
	margin-top: 26rpx;
	width: 100%;
	height: 88rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	color: #fff9f5;
	background: linear-gradient(135deg, #a87d60, #6d4a3c);
	box-shadow: 0 16rpx 32rpx rgba(109, 74, 60, 0.24);
}
</style>

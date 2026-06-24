<template>
	<view class="page-shell">
		<view class="ambient ambient-halo"></view>
		<view class="ambient ambient-shadow"></view>

		<view class="hero-card reveal-1">
			<view class="hero-mark">INSPIRATION HALL</view>
			<view class="hero-title">灵感大厅</view>
			<view class="hero-copy">
				每一张卡片都是一个记录入口，点击感兴趣的卡片，开始今天的书写。
			</view>
		</view>

		<view class="letter-card reveal-2" v-if="currentCard">
			<view class="letter-meta">
				<text class="mood-tag">{{ currentCard.mood }}</text>
				<text class="pick-count">当前灵感</text>
			</view>
			<view class="letter-title">{{ currentCard.title }}</view>
			<view class="letter-content">{{ currentCard.content }}</view>
			<view class="letter-author">—— 记录提示</view>
			<view class="action-row">
				<view class="ghost-button" @tap="loadRandomPost">换一张</view>
				<view class="solid-button" @tap="handlePick">去写记录</view>
			</view>
		</view>

		<view class="section-card reveal-3">
			<view class="section-head">
				<text class="section-title">更多灵感</text>
				<text class="section-link" @tap="loadRandomPost">随机抽取</text>
			</view>
			<view class="card-grid">
				<view
					v-for="card in shuffledCards"
					:key="card.id"
					class="mini-card"
					:class="{ 'mini-card-active': currentCard && currentCard.id === card.id }"
					@tap="selectCard(card)"
				>
					<text class="mini-mood">{{ card.mood }}</text>
					<text class="mini-title">{{ card.title }}</text>
				</view>
			</view>
		</view>

		<leaf-nav current="/pages/pick/index" />
	</view>
</template>

<script lang="ts">
import Vue from 'vue';
import LeafNav from '@/components/leaf-nav.vue';
import { INSPIRATION_CARDS, type Mood } from '@/config/constants';

type InspirationCard = {
	id: string;
	title: string;
	mood: Mood;
	content: string;
};

export default Vue.extend({
	components: { LeafNav },
	data() {
		return {
			cards: INSPIRATION_CARDS as InspirationCard[],
			currentCard: null as InspirationCard | null,
			loading: false
		};
	},
	computed: {
		shuffledCards(): InspirationCard[] {
			return [...this.cards].sort(() => Math.random() - 0.5).slice(0, 12);
		}
	},
	onShow() {
		this.loadRandomPost();
	},
	methods: {
		loadRandomPost() {
			this.loading = true;
			const idx = Math.floor(Math.random() * this.cards.length);
			this.currentCard = this.cards[idx];
			this.loading = false;
		},
		selectCard(card: InspirationCard) {
			this.currentCard = card;
		},
		handlePick() {
			if (!this.currentCard) {
				return;
			}
			// 传递灵感卡片的标题和内容到记录页
			const query = `inspirationTitle=${encodeURIComponent(this.currentCard.title)}&inspirationContent=${encodeURIComponent(this.currentCard.content)}&inspirationMood=${encodeURIComponent(this.currentCard.mood)}`;
			uni.navigateTo({ url: `/pages/write/index?${query}` });
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
	top: 180rpx;
	right: -120rpx;
	width: 350rpx;
	height: 350rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(74, 193, 240, 0.26), rgba(74, 193, 240, 0));
	animation: drift 12s ease-in-out infinite alternate;
}


.ambient-shadow {
	top: 760rpx;
	left: -120rpx;
	width: 320rpx;
	height: 320rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(255, 181, 112, 0.24), rgba(255, 181, 112, 0));
	animation: drift 15s ease-in-out infinite alternate-reverse;
}

.hero-card,
.letter-card,
.empty-card {
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
	line-height: 1.7;
	color: #3a6179;
}

.letter-card,
.empty-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.letter-meta {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.mood-tag {
	font-size: 22rpx;
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.75);
	border: 1rpx solid rgba(66, 150, 193, 0.22);
	color: #2f7fa8;
}

.pick-count {
	font-size: 22rpx;
	color: #4c7490;
}

.letter-title {
	margin-top: 14rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #1f465f;
	line-height: 1.35;
}

.letter-content {
	margin-top: 18rpx;
	font-size: 28rpx;
	line-height: 1.85;
	color: #3c6077;
}

.letter-author {
	margin-top: 18rpx;
	font-size: 23rpx;
	color: #8d6b5a;
}

.action-row {
	display: flex;
	gap: 16rpx;
	margin-top: 30rpx;
}

.empty-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #4a2f24;
	font-family: "STSong", "SimSun", serif;
}

.empty-copy {
	margin-top: 18rpx;
	font-size: 26rpx;
	line-height: 1.75;
	color: #6f5041;
}

.ghost-button,
.solid-button {
	height: 90rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 700;
}

.ghost-button {
	flex: 1;
	color: #266f95;
	background: rgba(255, 255, 255, 0.84);
	border: 1rpx solid rgba(64, 149, 193, 0.3);
}

.solid-button {
	flex: 1;
	color: #fff8f2;
	background: linear-gradient(130deg, #22b8f3, #3a8dff);
	box-shadow: 0 14rpx 26rpx rgba(37, 123, 189, 0.34);
}

.solid-button.full {
	width: 100%;
	margin-top: 26rpx;
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
	color: #183143;
}

.section-link {
	font-size: 23rpx;
	color: #2f86b1;
	font-weight: 700;
}

.card-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16rpx;
}

.mini-card {
	padding: 24rpx;
	border-radius: 20rpx;
	background: rgba(255, 255, 255, 0.88);
	border: 1rpx solid rgba(66, 150, 193, 0.22);
	transition: all 0.2s;
}

.mini-card:active {
	transform: scale(0.96);
}

.mini-card-active {
	background: linear-gradient(135deg, rgba(34, 184, 243, 0.15), rgba(58, 141, 255, 0.15));
	border-color: rgba(34, 184, 243, 0.4);
}

.mini-mood {
	display: block;
	font-size: 22rpx;
	color: #2f7fa8;
	margin-bottom: 8rpx;
}

.mini-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #1f465f;
	line-height: 1.4;
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
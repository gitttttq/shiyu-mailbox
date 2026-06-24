/**
 * 拾语信箱 - 数据请求层
 * 优先走微信云开发云函数，HTTP 仅用于本地调试兜底
 */

declare const wx: any;

export type TreeholePostStatus = 'pending' | 'approved' | 'hidden';

export type TreeholePost = {
	id: string;
	authorId: string;
	openid?: string;
	nickname: string;
	title: string;
	mood: string;
	content: string;
	status: TreeholePostStatus;
	pickedCount: number;
	createdAt: string;
	updatedAt: string;
};

export type TreeholeUser = {
	id?: number | string;
	openid?: string;
	nickname: string;
	createdAt?: string;
	lastActiveAt?: string;
	postCount?: number;
	approvedCount?: number;
	pendingCount?: number;
};

export type ViewerIdentity = {
	openid: string;
	isAdmin: boolean;
};

type TreeholeResponse<T> = {
	ok: boolean;
	data: T;
	message?: string;
};

// ========== 配置 ==========
const CLOUD_FUNCTION_NAME = 'treehole';

// ========== 本地存储 ==========
const STORAGE_NICKNAME_KEY = 'shiyu-nickname';
const STORAGE_ADMIN_KEY = 'shiyu-admin-key';
const STORAGE_USER_ID_KEY = 'shiyu-user-id';

// ========== 用户标识 ==========
function generateUserId(): string {
	return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

export function getUserId(): string {
	let userId = uni.getStorageSync(STORAGE_USER_ID_KEY);
	if (!userId) {
		userId = generateUserId();
		uni.setStorageSync(STORAGE_USER_ID_KEY, userId);
	}
	return userId;
}

export function getNickname(): string {
	return uni.getStorageSync(STORAGE_NICKNAME_KEY) || '匿名来信者';
}

export function saveNickname(nickname: string) {
	uni.setStorageSync(STORAGE_NICKNAME_KEY, nickname.trim() || '匿名来信者');
}

export function getAdminKey(): string {
	return uni.getStorageSync(STORAGE_ADMIN_KEY) || '';
}

export function saveAdminKey(key: string) {
	uni.setStorageSync(STORAGE_ADMIN_KEY, key.trim());
}

function isWechatCloudAvailable() {
	// #ifdef MP-WEIXIN
	return typeof wx !== 'undefined' && !!(wx as any).cloud;
	// #endif
	// #ifndef MP-WEIXIN
	return false;
	// #endif
}

function callCloud<T>(action: string, data?: Record<string, unknown>): Promise<T> {
	return new Promise((resolve, reject) => {
		if (!isWechatCloudAvailable()) {
			reject(new Error('当前环境不可用云开发'));
			return;
		}

		(wx as any).cloud.callFunction({
			name: CLOUD_FUNCTION_NAME,
			data: {
				action,
				data: data || {}
			},
			success(res: { result: TreeholeResponse<T> }) {
				const body = res.result;
				if (body && body.ok) {
					resolve(body.data);
					return;
				}
				reject(new Error((body && body.message) || '云函数请求失败'));
			},
			fail(err: { errMsg?: string }) {
				reject(new Error(err.errMsg || '云函数调用失败'));
			}
		});
	});
}

// ========== 业务接口 ==========

/** 获取首页数据（统计 + 最新公开信件） */
export function fetchHomeData() {
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}

	return callCloud<{
		stats: {
			users: number;
			approvedPosts: number;
			pendingPosts: number;
			pickedCount: number;
			moods: Record<string, number>;
		};
		posts: TreeholePost[];
	}>('home');
}

/** 随机获取一封公开信件 */
export function fetchRandomPost() {
	const openid = getUserId();
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}
	return callCloud<{ post: TreeholePost | null }>('random', { excludeOpenid: openid });
}

/** 拾取信件 */
export function pickPost(postId: string) {
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}

	return callCloud<{ post: TreeholePost }>('pick', {
		postId,
		openid: getUserId()
	});
}

/** 创建新信件 */
export function createPost(input: { nickname: string; title: string; mood: string; content: string }) {
	saveNickname(input.nickname);
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}

	return callCloud<{ post: TreeholePost }>('createPost', {
		openid: getUserId(),
		nickname: input.nickname,
		title: input.title,
		mood: input.mood,
		content: input.content
	});
}

/** 获取我的信件列表 */
export function fetchMyPosts() {
	const openid = getUserId();
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}

	return callCloud<{
		user: TreeholeUser | null;
		posts: TreeholePost[];
	}>('myPosts', { openid });
}

/** 获取管理后台概览 */
export function fetchAdminOverview(key: string) {
	saveAdminKey(key);
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}

	return callCloud<{
		totals: {
			users: number;
			posts: number;
			approved: number;
			pending: number;
			hidden: number;
		};
	}>('adminOverview', { key });
}

/** 获取管理后台信件列表 */
export function fetchAdminPosts(input: { key: string; status: string; mood: string; keyword: string }) {
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}
	return callCloud<{ posts: TreeholePost[] }>('adminPosts', input);
}

/** 获取管理后台用户列表 */
export function fetchAdminUsers(key: string) {
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}
	return callCloud<{ users: TreeholeUser[] }>('adminUsers', { key });
}

/** 更新信件状态 */
export function updateAdminPostStatus(key: string, postId: string, status: TreeholePostStatus) {
	if (!isWechatCloudAvailable()) {
		return Promise.reject(new Error('当前环境不支持微信云开发'));
	}
	return callCloud<{ post: TreeholePost }>('updatePostStatus', {
		key,
		postId,
		status
	});
}

/** 获取当前访问者身份（用于管理员入口显隐） */
export function fetchViewerIdentity() {
	if (!isWechatCloudAvailable()) {
		return Promise.resolve<ViewerIdentity>({
			openid: '',
			isAdmin: false
		});
	}

	return callCloud<ViewerIdentity>('viewer');
}
/**
 * 时语信箱 - 数据请求层
 * 通过 HTTP 请求与后端 API 通信
 */

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
	id?: number;
	openid?: string;
	nickname: string;
	createdAt?: string;
	lastActiveAt?: string;
	postCount?: number;
	approvedCount?: number;
	pendingCount?: number;
};

type TreeholeResponse<T> = {
	ok: boolean;
	data: T;
	message?: string;
};

// ========== 配置 ==========
// 开发环境使用本地地址，生产环境替换为你的服务器域名
const API_BASE_URL = 'http://localhost:3007/api';

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

// ========== HTTP 请求封装 ==========
function request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: Record<string, unknown>, headers?: Record<string, string>): Promise<T> {
	return new Promise((resolve, reject) => {
		uni.request({
			url: API_BASE_URL + path,
			method,
			data,
			header: {
				'Content-Type': 'application/json',
				...headers
			},
			success(res) {
				const body = res.data as TreeholeResponse<T>;
				if (res.statusCode >= 200 && res.statusCode < 300 && body && body.ok) {
					resolve(body.data);
				} else {
					reject(new Error((body && body.message) || '请求失败'));
				}
			},
			fail(err) {
				reject(new Error(err.errMsg || '网络请求失败'));
			}
		});
	});
}

// ========== 业务接口 ==========

/** 获取首页数据（统计 + 最新公开信件） */
export function fetchHomeData() {
	return request<{
		stats: {
			users: number;
			approvedPosts: number;
			pendingPosts: number;
			pickedCount: number;
			moods: Record<string, number>;
		};
		posts: TreeholePost[];
	}>('GET', '/posts/home');
}

/** 随机获取一封公开信件 */
export function fetchRandomPost() {
	const openid = getUserId();
	return request<{ post: TreeholePost | null }>('GET', '/posts/random?excludeOpenid=' + encodeURIComponent(openid));
}

/** 拾取信件 */
export function pickPost(postId: string) {
	return request<{ post: TreeholePost }>('POST', '/posts/' + postId + '/pick', {
		openid: getUserId()
	});
}

/** 创建新信件 */
export function createPost(input: { nickname: string; title: string; mood: string; content: string }) {
	saveNickname(input.nickname);
	return request<{ post: TreeholePost }>('POST', '/posts', {
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
	return request<{
		user: TreeholeUser | null;
		posts: TreeholePost[];
	}>('GET', '/posts/mine/' + encodeURIComponent(openid));
}

/** 获取管理后台概览 */
export function fetchAdminOverview(key: string) {
	saveAdminKey(key);
	return request<{
		totals: {
			users: number;
			posts: number;
			approved: number;
			pending: number;
			hidden: number;
		};
	}>('GET', '/admin/overview', undefined, {
		'x-admin-key': key
	});
}

/** 获取管理后台信件列表 */
export function fetchAdminPosts(input: { key: string; status: string; mood: string; keyword: string }) {
	const params = new URLSearchParams();
	if (input.status && input.status !== 'all') params.append('status', input.status);
	if (input.mood && input.mood !== 'all') params.append('mood', input.mood);
	if (input.keyword) params.append('keyword', input.keyword);
	const query = params.toString();
	return request<{ posts: TreeholePost[] }>('GET', '/admin/posts' + (query ? '?' + query : ''), undefined, {
		'x-admin-key': input.key
	});
}

/** 获取管理后台用户列表 */
export function fetchAdminUsers(key: string) {
	return request<{ users: TreeholeUser[] }>('GET', '/admin/users', undefined, {
		'x-admin-key': key
	});
}

/** 更新信件状态 */
export function updateAdminPostStatus(key: string, postId: string, status: TreeholePostStatus) {
	return request<{ post: TreeholePost }>('PUT', '/admin/posts/' + postId + '/status', {
		status
	}, {
		'x-admin-key': key
	});
}
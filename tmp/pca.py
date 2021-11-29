import numpy as np

def pca(data):
    '''
    主成分分析。\n
        Arg: 
            data: 存放训练数据的矩阵，每一行为一条训练数据，np(num,dim)
        Return:
            V: 变换矩阵，np(dim,dim)
            S: 特征值，np(dim)
            mean_x：各维度的平均值，np(dim)
    '''
    num_data, dim = data.shape
    X = data

    if dim > num_data: # 当数据维度很大时，使用对角化求解
        M = np.dot(X, X.T) # 协方差矩阵
        e, ev = np.linalg.eigh(M) # 特征值和特征向量
        tmp = np.dot(X.T, ev).T
        V = tmp[::-1]
        S = np.sqrt(e)[::-1]
        for i in range(V.shape[1]):
            V[:,i] /= S
    else:
        U, S, V = np.linalg.svd(X) # 奇异值分解
    
    return V, S


def get_main_and_recov_data(data, proj, k):
    '''获取仅用主成分恢复出来的数据'''
    main_data = np.zeros_like(data)
    main_data[:k] = np.dot(data, proj[:k].T)
    print(main_data)
    recov_data = np.dot(main_data, proj)
    return recov_data, main_data


arr = ['剪刀', '拳头', '布', 'good', '666', '1', 'ok']
container = []

import json
for name in arr:
    with open(name + '.json', 'r') as f:
        action = np.array(json.load(f)['data'])[:,:-1].reshape(-1)
        container.append(action)

container = np.stack(container, axis=0)
proj, diag = pca(container) # (5,63),(5,)
# data = np.array(exp5)[:,:-1].reshape(-1) # (1,63)
print(get_main_and_recov_data(container[6], proj, 3))

with open('./proj.json', 'w') as f:
    json.dump(proj.tolist(), f);

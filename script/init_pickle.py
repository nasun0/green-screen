import pickle


with open('memo.pickle', 'wb') as f:
    pickle.dump({'news': {}, 'query': {}}, f, pickle.HIGHEST_PROTOCOL)

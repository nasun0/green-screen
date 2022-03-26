import openai
import requests
import json
import pickle
import random
from flask import Flask
from flask_cors import CORS, cross_origin

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app)
cross_origin_args = {'origin': '*', 'headers': ['Content-Type']}
openai.api_key = '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'
finnhub_token = 'c5cau7aad3ib55bb0h20'
# automobile, sportswear, space, eco friendly
extra = ['NKE', 'LMT', 'GS', 'WM', 'SBUX']
ignores = ['COG']


def get_news_summary(symbol, memo):
    if symbol not in memo['news']:
        url = (f'https://finnhub.io/api/v1/company-news?symbol={symbol}'
               f'&from=2021-09-01&to=2021-09-09&token={finnhub_token}')
        response = requests.get(url)
        if response.status_code == 200:
            memo['news'][symbol] = json.loads(response.text)
        else:
            print("not good")
            raise Exception
    return [i['summary'] for i in memo['news'][symbol]]


def process_query(symbol, query, memo):
    if query == 'high risk':
        if memo['basic'][symbol]['beta'] and memo['basic'][symbol]['beta'] > 1:
            return 1
        return -10000
    elif query == 'low risk':
        if memo['basic'][symbol]['beta'] and memo['basic'][symbol]['beta'] < 1:
            return 1
        return -10000
    summaries = get_news_summary(symbol, memo)
    if (symbol, query) not in memo['query']:
        engine = openai.Engine('ada')
        search_res = engine.search(search_model='ada',
                                   query=query, max_rerank=5,
                                   documents=summaries[:200])
        memo['query'][(symbol, query)] = dict(search_res)['data']
    scores = [i['score'] for i in memo['query'][(symbol, query)]]
    thresholded_scores = [i for i in scores if i > 0]
    if len(thresholded_scores) == 0:
        return 0
    return sum(thresholded_scores) / len(thresholded_scores)


def process_queries(symbols, queries):
    with open('memo.pickle', 'rb') as f:
        f.seek(0)
        memo = pickle.load(f)
    scores = {}
    for i in symbols:
        avgs = []
        for j in queries:
            print(f"processing ticker {i} query {j}")
            avgs.append(process_query(i, j, memo))
        scores[i] = avgs
    with open('memo.pickle', 'wb') as f:
        pickle.dump(memo, f, pickle.HIGHEST_PROTOCOL)
    return scores


def get_all_symbols():
    with open('../src/assets/companies.json') as f:
        companies = json.load(f)
    return list(companies.keys())


def get_random_symbols():
    symbols = get_all_symbols()
    random_sample = random.sample(symbols, 40)
    for i in extra:
        if i not in random_sample:
            random_sample.append(i)
    for i in ignores:
        if i in random_sample:
            random_sample.remove(i)
    return random_sample


def init_news():
    companies = get_all_symbols()
    for i in companies:
        with open('memo.pickle', 'rb') as f:
            memo = pickle.load(f)
        print(f"initing news of {i} index {companies.index(i)}")
        summaries = get_news_summary(i, memo)
        print(f"number of summaries: {len(summaries)}")
        with open('memo.pickle', 'wb') as f:
            pickle.dump(memo, f, pickle.HIGHEST_PROTOCOL)


def init_basic_data():
    companies = get_all_symbols()
    with open('memo.pickle', 'rb') as f:
        memo = pickle.load(f)
    if 'basic' not in memo:
        memo['basic'] = {}
    for symbol in companies:
        print(f"initing symbol of {symbol} index {companies.index(symbol)}")
        if symbol not in memo['basic'] or len(memo['basic'][symbol]) == 0:
            url = (f'https://finnhub.io/api/v1/stock/metric?symbol={symbol}'
                   f'&metric=all&token={finnhub_token}')
            response = requests.get(url)
            if response.status_code == 200:
                memo['basic'][symbol] = {}
                response = json.loads(response.text)
                memo['basic'][symbol]['volume'] = response["metric"]["10DayAverageTradingVolume"]
                memo['basic'][symbol]['high'] = response["metric"]["52WeekHigh"]
                memo['basic'][symbol]['low'] = response["metric"]["52WeekLow"]
                memo['basic'][symbol]['price_return_daily'] = response["metric"]["52WeekPriceReturnDaily"]
                memo['basic'][symbol]['beta'] = response["metric"]["beta"]
            else:
                break
    with open('memo.pickle', 'wb') as f:
        pickle.dump(memo, f, pickle.HIGHEST_PROTOCOL)


@app.route("/get_random_query/<queries>")
@cross_origin(**cross_origin_args)
def get_random_query(queries):
    queries = queries.split(',')
    symbols = get_random_symbols()
    result = process_queries(symbols, queries)
    result = [(sum(j) / len(j), i, j) for i, j in result.items()]
    result.sort()
    result = list(reversed(result))[:10]
    print(f"prev result: {result}")
    result = [[j, [round(n / sum(result[0][2]) * 100) for n in k]]
              for i, j, k in result]
    print(f"result: {result}")
    return json.dumps(result)


@app.route("/get_news/<symbol>")
@cross_origin(**cross_origin_args)
def get_news(symbol):
    with open('memo.pickle', 'rb') as f:
        f.seek(0)
        memo = pickle.load(f)
    res = []
    if symbol not in memo['news']:
        get_news_summary(symbol, memo)
        with open('memo.pickle', 'wb') as f:
            pickle.dump(memo, f, pickle.HIGHEST_PROTOCOL)
    for i in memo['news'][symbol]:
        if i['headline'] == '' or i['image'] == '' or i['url'] == '':
            continue
        res.append({'headline': i['headline'], 'image': i['image'],
                    'url': i['url']})
        if len(res) == 20:
            break
    return json.dumps(res)


@app.route("/get_stats/<symbol>")
@cross_origin(**cross_origin_args)
def get_stats(symbol):
    with open('memo.pickle', 'rb') as f:
        f.seek(0)
        memo = pickle.load(f)
    res = memo['basic'][symbol]
    print(res)
    return json.dumps(res)
# init_news()
# init_basic_data()

import React, { useState, useEffect } from 'react';
import logo from './images/Logo.png';
import rocket from './images/Rocket.png';
import trash from './images/TrashCan.png';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Divider from '@mui/material/Divider';
import { motion, AnimatePresence, AnimateSharedLayout } from "framer-motion";
import { Cell, PolarRadiusAxis, LineChart, Line, YAxis, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import TextField from '@mui/material/TextField';
import companies from './assets/companies';
import TagsInput from './TagsInput';
import './App.css';

const author = "Jimmy Ding";

const colors = ["#ed9755", "#b06bff", "#d164bd", "#75d8ff", "#ffd859"];
let colorMap = {};
let idx = 0;
const does_fetch = true;
let comment_map = {};

function getColor(category) {
  if (!(category in colorMap)) {
    idx = (idx + 1) % colors.length;
    colorMap[category] = colors[idx];
  }
  return colorMap[category];
}

function numberWithCommas(x) {
  return x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function Backdrop(props) {
  const variance = {
    "visible": {
      opacity: 1,
    },
    "hidden": {
      opacity: 0,
    },
  };
  return (
    <AnimatePresence exitBeforeEnter>
      {props.showBackdrop && (<motion.div variances={variance} initial="hidden" animate="visible" style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '1000vh', zIndex: 3, backgroundColor: '#000000d8'
      }} onClick={() => props.leaveDetailed()}/>)}
    </AnimatePresence>
  );
}

function DetailedView(props) {
  const {width, height} = useWindowDimensions();
  const [data, setData] = useState([]);
  const color = data.length > 0 && data[0].value >= data[data.length - 1].value ? '#ff2222' : 'lime';
  const [time, setTime] = useState("1W");
  const [news, setNews] = useState([]);
  const [price, setPrice] = useState(0);
  const [dayChange, setDayChange] = useState(0);
  const [comments, setComments] = useState(props.symbol in comment_map ? comment_map[props.symbol] : []);
  const [writtenPost, setWrittenPost] = useState("");
  const [stats, setStats] = useState({});
  useEffect(() => {
    if (data && data.length === 0) {
      let url = 'https://finnhub.io/api/v1/stock/candle?symbol=';
      url += props.symbol;
      url += '&resolution=';
      if (time === '1W' || time === '1M')
        url += '5';
      else if (time === '3M' || time === '6M')
        url += '15';
      else
        url += '30';
      const newTime = parseInt(new Date().getTime() / 1000);
      let prevTime = newTime;
      if (time === '1W')
        prevTime -= 7 * 24 * 60 * 60;
      else if (time === '1M')
        prevTime -= 30 * 24 * 60 * 60;
      else if (time === '3M')
        prevTime -= 3 * 30 * 24 * 60 * 60;
      else if (time === '6M')
        prevTime -= 6 * 30 * 24 * 60 * 60;
      else
        prevTime -= 12 * 30 * 24 * 60 * 60;
      url += '&from=';
      url += prevTime;
      url += '&to=';
      url += newTime;
      url += '&token=c5cau7aad3ib55bb0h20';
      if (does_fetch) {
        fetch("http://127.0.0.1:5000/get_stats/" + props.symbol).then(response => response.json()).then(data => setStats(data));
        fetch(url).then(response => response.json()).then(data => {
          setData(data["c"].map(x => ({value: x})));
          setPrice(data["c"][data["c"].length - 1]);
          setDayChange(Math.round(data["c"][data["c"].length - 1] * 100 - data["c"][0] * 100) / 100);
        }).catch(error => console.error("fetch error, please check if symbol is correct, but rate limit can also be passed"));
        fetch("http://127.0.0.1:5000/get_news/" + props.symbol).then(response => response.json()).then(data => setNews(data));
      }
    }
  }, [time, props.symbol, data]);
  const remove = props.removeStock;

  return (
    <>
      <div style={{position: 'absolute', width: 800, height: 600, left: (width - 800) / 2, top: -120, display: 'flex', flexDirection: 'column', zIndex: 4}}>
        <div style={{position: 'absolute', right: -5, top: 15, width: 160, display: 'flex', flexDirection: 'column'}}>
          <motion.span style={{fontSize: 42, fontWeight: 'bold', textAlign: 'right'}}>{price.toFixed(2)}</motion.span>
          <motion.span style={{fontSize: 32, borderRadius: 6, alignSelf: 'center', textAlign: 'right', width: '80%', padding: 4, borderWidth: 1, borderColor: dayChange >= 0 ? 'lime' : '#ff2222', borderStyle: 'solid', color: dayChange >= 0 ? 'lime' : '#ff2222', marginLeft: 8, marginTop: 8, marginBottom: 6}}>{dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}</motion.span>
        </div>
        {remove && <div style={{
          position: 'absolute', left: 7, top: 160
        }} onClick={() => remove(props.symbol)}>
          <img src={trash} width="45px" alt="Trash can"/>
        </div>}
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <motion.span layoutId={props.symbol + "_symbol"} style={{fontSize: 80, fontWeight: 'bold', color: '#eeeeee'}}>{props.symbol}</motion.span>
          <span style={{marginTop: 16, marginLeft: 15}}>{props.numStocks === -1 ? 0 : props.numStocks}<br/>Shares</span>
        </div>
        <motion.span layoutId={props.symbol + "_name"} style={{fontSize: 35, color: '#aaaaaa'}}>{props.name}</motion.span>
        <ButtonGroup variant="outlined" style={{marginTop: 40, marginLeft: 140}}>
          <Button onClick={() => {setTime("1W");setData([])}}>1W</Button>
          <Button onClick={() => {setTime("1M");setData([])}}>1M</Button>
          <Button onClick={() => {setTime("3M");setData([])}}>3M</Button>
          <Button onClick={() => {setTime("6M");setData([])}}>6M</Button>
          <Button onClick={() => {setTime("1Y");setData([])}}>1Y</Button>
        </ButtonGroup>
        <motion.div layoutId={props.symbol + "_chart"}>
          {data.length > 0 ? (
            <LineChart width={800} height={250} data={data} margin={{top: 60, right: 0, bottom: 20, left: 0}}>
              <YAxis type="number" domain={['dataMin', 'dataMax']} width={120}/>
              <Line type="monotone" dataKey="value" stroke={color} dot={false}/>
            </LineChart>
          ) : <div style={{width: 800, height: 250}} />}
        </motion.div>
        <AnimatePresence>
          {Object.keys(stats).length !== 0 && (
            <motion.div style={{fontSize: 20, width: 800, marginTop: 40, display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                {'volume' in stats && (<span style={{marginBottom: 16}}>10 week average volume: <span style={{marginLeft: 4, fontWeight: 'normal', color: '#aaaaaa'}}>{stats['volume'].toFixed(2)}</span></span>)}
                {'high' in stats && (<span style={{marginBottom: 16}}>52 week high: <span style={{marginLeft: 4, fontWeight: 'normal', color: '#aaaaaa'}}>{stats['high'].toFixed(2)}</span></span>)}
                {'low' in stats && (<span style={{marginBottom: 16}}>52 week low: <span style={{marginLeft: 4, fontWeight: 'normal', color: '#aaaaaa'}}>{stats['low'].toFixed(2)}</span></span>)}
              </div>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                {'price_return_daily' in stats && (<span style={{marginBottom: 16}}>52 week price return daily: <span style={{marginLeft: 4, fontWeight: 'normal', color: '#aaaaaa'}}>{stats['price_return_daily'].toFixed(2)}</span></span>)}
                {'beta' in stats && (<span style={{marginBottom: 16}}>beta: <span style={{marginLeft: 4, fontWeight: 'normal', color: '#aaaaaa'}}>{stats['beta'].toFixed(2)}</span></span>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{width: 800, marginTop: 60, display: 'flex', flexDirection: 'column'}}>
          <TextField multiline rows={4} maxRows={4} value={writtenPost} onChange={event => {
            setWrittenPost(event.target.value);
          }} label="Write Comment" placeholder="Write a comment to share with the world" fullWidth/>
          <Button variant='outlined' style={{alignSelf: 'flex-start', marginTop: 10, marginBottom: 48}} onClick={() => {
            setComments(comments.concat([[writtenPost, author, new Date()]]));
            comment_map[props.symbol] = comments.concat([[writtenPost, author, new Date()]]);
            setWrittenPost("");
          }}>Post</Button>
        </div>
        <Divider width="800"/>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {comments.map(comment => (
            <>
              <div style={{display: 'flex', margin: 45, marginBottom: 10, color: '#cccccc', fontWeight: 'bold', fontFamily: 'Caviar Dreams', fontSize: 22}}>
                <span>{comment[1]}</span>
                <span style={{marginLeft: 20, fontSize: 18, alignSelf: 'center', color: '#666666'}}>Today at {comment[2].toLocaleTimeString()}</span>
              </div>
              <span style={{margin: 45, marginTop: 0, width: 710, fontFamily: 'Caviar Dreams'}}>{comment[0]}</span>
              <Divider width="800"/>
            </>
          ))}
        </div>
        <div>
          {news.map(news_elem => (
            <div key={news_elem['url']} style={{display: 'flex', flexDirection: 'row', marginTop: 50}}>
              {(news.indexOf(news_elem) % 2 === 0) ? (
                <motion.div style={{backgroundImage: 'url(' + news_elem['image'] + ')', minWidth: 350, width: 350, height: 260, backgroundPosition: 'center', }}/>
              ) : (
                <a href={news_elem['url']} style={{fontSize: 40, fontWeight: 'bold', textAlign: 'left', alignSelf: 'center'}}>
                  <span style={{color: 'white', textDecorationStyle: ''}}>{news_elem['headline']}</span>
                </a>
              )}
              {(news.indexOf(news_elem) % 2 === 0) ? (
                <a href={news_elem['url']} style={{fontSize: 40, fontWeight: 'bold', textAlign: 'right', alignSelf: 'center'}}>
                  <span style={{color: 'white', textDecorationStyle: ''}}>{news_elem['headline']}</span>
                </a>
              ) : (
                <motion.div style={{backgroundImage: 'url(' + news_elem['image'] + ')', minWidth: 350, width: 350, height: 260, backgroundPosition: 'center', }}/>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function SearchTagInput(props) {
  const variant = {
    atHome: {
      y: -10,
      opacity: 0,
    },
    transitionToExplore: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    },
    atExplore: {
      y: 0,
      opacity: 1,
    },
    transitionToHome: {
      y: -10,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    },
  }
  return (
    <motion.div variants={variant} initial={{opacity: 0}}>
      <FormControl sx={{ m: 1, width: 400 }} style={{marginLeft: 16}}>
        <TagsInput 
          selectedTags={items => props.setSearchTags(items)}
          fullWidth
          variant='outlined'
          placeholder={props.searchTags.length === 0 ? "Input keywords or categories" : ""}
          label="Search"
          getColorFn={getColor}
        />
      </FormControl>
    </motion.div>
  );
}

function Header(props) {
  return (
    <div style={{marginLeft: 300, marginRight: 300, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <img src={logo} alt={"logo"} width="90px" style={{
          margin: 32,
          marginRight: 0,
        }} onClick={() => props.changeScreen(false)} />
        {(props.state === "atHome" || props.state === "transitionToHome") && <span style={{position: 'absolute', left: 515, fontSize: 80, fontWeight: 'lighter', color: 'white'}}>Your Portfolio</span>}
        <SearchTagInput searchTags={props.searchTags} setSearchTags={props.setSearchTags} state={props.state}/>
        <img src={rocket} alt={"rocket"} width="90px" style={{
          margin: 32,
          marginLeft: 0,
        }} onClick={() => props.changeScreen(true)}/>
    </div>
  );
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

function Portfolio(props) {
  const {width} = useWindowDimensions();
  const [detailed, setDetailed] = useState("");
  const [name, setName] = useState("");
  const [relevance, setRelevance] = useState([]);
  const [amount, setAmount] = useState(-1);
  function handleDetailView(symbol, name, relevance, amt) {
    setDetailed(symbol);
    setName(name);
    setRelevance(relevance);
    setAmount(amt);
  }
  return (
    <div style={{
      paddingLeft: 370,
      textAlign: 'left',
      color: '#eeeeee',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#111111',
      width: width - 370
    }}>
      <AnimateSharedLayout>
        {props.portfolio.map(suggestion => (
          <ExploreStock key={suggestion.symbol} symbol={suggestion.symbol} name={companies[suggestion.symbol][0]} time={"1W"} relevance={[]} handleDetailView={handleDetailView} numStocks={suggestion.amount} unprocessedCompanies={props.unprocessedCompanies} totalWorth={props.totalWorth} setTotalWorth={props.setTotalWorth} setUnprocessedCompanies={props.setUnprocessedCompanies} searchTags={[]}/>
        ))}
        <Backdrop showBackdrop={detailed !== ""} leaveDetailed={() => setDetailed("")}/>
        {detailed !== "" && <DetailedView symbol={detailed} name={name} relevance={relevance} numStocks={amount} removeStock={symbol => {
          let index;
          for (let idx = 0; idx < props.portfolio.length; idx++)
            if (props.portfolio[idx].symbol === symbol)
              index = idx;
          props.setPortfolio(props.portfolio.slice(0, index).concat(props.portfolio.slice(index + 1)));
          props.setTotalWorth(props.totalWorth - 118.24);
          setDetailed("");
        }}/>}
        <AddStock setPortfolio={props.setPortfolio} portfolio={props.portfolio} unprocessedCompanies={props.unprocessedCompanies} setUnprocessedCompanies={props.setUnprocessedCompanies}/>
      </AnimateSharedLayout>
    </div>
  )
}

function HomeScreen() {
  const {width, height} = useWindowDimensions();
  const [totalWorth, setTotalWorth] = useState(7263);
  const [portfolio, setPortfolio] = useState([
    {symbol: "GS", amount: 1},
    {symbol: "AAPL", amount: 1},
    {symbol: "SBUX", amount: 1},
    {symbol: "NKE", amount: 1},
    {symbol: "TMUS", amount: 1},
    {symbol: "AMZN", amount: 1},
    {symbol: "FB", amount: 1},
    {symbol: "GOOGL", amount: 1},
  ]);
  const [unprocessedCompanies, setUnprocessedCompanies] = useState(new Set(
    // ["GS", "AAPL", "SBUX", "NKE", "TMUX", "AMZN", "FB", "GOOGL"]
  ));
  return (
    <div style={{
      textAlign: 'left'
    }}>
      <div style={{
        height: height-164-800,
        width: width,
        backgroundColor: '#111111',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h1 style={{margin: 0, marginBottom: 30, fontWeight: 'lighter', color: 'rgb(255, 204, 0)'}}>Total Assets: ${numberWithCommas(totalWorth)}</h1>
      </div>
      <Portfolio portfolio={portfolio} setPortfolio={setPortfolio} totalWorth={totalWorth} setTotalWorth={setTotalWorth} unprocessedCompanies={unprocessedCompanies} setUnprocessedCompanies={setUnprocessedCompanies}/>
    </div>
  );
}

function ExploreStock(props) {
  const [data, setData] = useState([]);
  const [price, setPrice] = useState(0);
  const [dayChange, setDayChange] = useState(0);
  useEffect(() => {
    if (data && data.length === 0) {
      let url = 'https://finnhub.io/api/v1/stock/candle?symbol=';
      url += props.symbol;
      url += '&resolution=';
      if (props.time === '1W' || props.time === '1M')
        url += '5';
      else if (props.time === '3M' || props.time === '6M')
        url += '15';
      else
        url += '30';
      const time = parseInt(new Date().getTime() / 1000);
      let prevTime = time;
      if (props.time === '1W')
        prevTime -= 7 * 24 * 60 * 60;
      else if (props.time === '1M')
        prevTime -= 30 * 24 * 60 * 60;
      else if (props.time === '3M')
        prevTime -= 3 * 30 * 24 * 60 * 60;
      else if (props.time === '6M')
        prevTime -= 6 * 30 * 24 * 60 * 60;
      else
        prevTime -= 12 * 30 * 24 * 60 * 60;
      url += '&from=';
      url += prevTime;
      url += '&to=';
      url += time;
      url += '&token=c5cau7aad3ib55bb0h20';
      if (does_fetch) {
        fetch(url).then(response => response.json()).then(data => {
          setData(data["c"].map(x => ({value: x})));
          if (props.unprocessedCompanies && props.unprocessedCompanies.delete(props.symbol)) {
            props.setUnprocessedCompanies(props.unprocessedCompanies);
            props.setTotalWorth(props.totalWorth + data["c"][data["c"].length - 1] * props.numStocks);
          }
          setPrice(data["c"][data["c"].length - 1]);
          setDayChange(Math.round(data["c"][data["c"].length - 1] * 100 - data["c"][0] * 100) / 100);
        }).catch(error => console.error(error + "fetch error, please check if symbol is correct, but rate limit can also be passed"));
      }
    }
  });
  const symbol = props.symbol;
  // 1W, 1M, 3M, 6M, 1Y
  // const time = props.time;
  const color = data.length > 0 && data[0].value >= data[data.length - 1].value ? '#ff2222' : 'lime';
  return (
    <>
      <Divider width="700"/>
      <div style={{display: 'flex', marginBottom: 10, marginTop: 10, cursor: 'pointer'}} onClick={() => props.handleDetailView(symbol, props.name, props.relevance, props.numStocks)}>
        <div style={{width: 140, marginLeft: 20, display: 'flex', flexDirection: 'column', alignSelf: 'center'}}>
          <motion.span layoutId={symbol + "_symbol"} style={{fontSize: 20, fontWeight: 'bold'}}>{symbol}</motion.span>
          <motion.span layoutId={symbol + "_name"} style={{fontSize: 14, color: '#aaaaaa'}}>{props.name}</motion.span>
        </div>
        <motion.div layoutId={symbol + "_chart"}>
          {data.length > 0 ? (
            <LineChart style={{marginLeft: 15, marginRight: 15}} width={props.searchTags.length > 0 ? 200 : 400} height={50} data={data}>
              <YAxis style={{display: 'none'}} width={0} type="number" domain={['dataMin', 'dataMax']} />
              <Line type="monotone" dataKey="value" stroke={color} dot={false}/>
            </LineChart>
          ) : <div style={{width: props.searchTags.length > 0 ? 230 : 430, height: 50}} />}
        </motion.div>
        <div style={{marginLeft: 10, width: 80, display: 'flex', flexDirection: 'column'}}>
          <motion.span style={{fontSize: 20, fontWeight: 'bold', textAlign: 'right'}}>{price.toFixed(2)}</motion.span>
          <motion.span style={{fontSize: 18, borderRadius: 6, alignSelf: 'center', textAlign: 'right', width: '80%', padding: 4, borderWidth: 1, borderColor: dayChange >= 0 ? 'lime' : '#ff2222', borderStyle: 'solid', color: dayChange >= 0 ? 'lime' : '#ff2222', marginLeft: 8, marginTop: 4, marginBottom: 6}}>{dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}</motion.span>
        </div>
        <div style={{width: 170, display: 'flex', flexDirection: 'row', marginRight: 16, marginLeft: 16, alignItems: 'center', justifyContent: 'flex-end'}}>
          {props.searchTags.map(value => props.relevance[props.searchTags.indexOf(value)] !== undefined && (
            <Chip key={value} label={props.relevance[props.searchTags.indexOf(value)] + "%"} style={{marginBottom: 10, marginRight: 4, color: getColor(value), backgroundColor: getColor(value) + '30'}}/>
          ))}
        </div>

      </div>
    </>
  )
}

function AddStock(props) {
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState(0);

  return (
    <>
      <Divider width="700"/>
      <div style={{width: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
        <TextField label="Symbol" value={symbol} onChange={event => setSymbol(event.target.value)}/>
        <TextField label="Amount" type="number" value={amount} onChange={event => setAmount(parseInt(event.target.value))}/>
        <Button variant="outlined" style={{height: 56, width: 200}} onClick={() => {
          console.log("checking if symbol " + symbol + " exists");
          console.log(companies);
          console.log(companies[symbol]);
          if (companies[symbol] !== undefined) {
            console.log("symbol does exist");
            props.setPortfolio(props.portfolio.concat([{symbol: symbol, amount: amount}]));
            props.unprocessedCompanies.add(symbol);
            props.setUnprocessedCompanies(props.unprocessedCompanies)
          }
          setSymbol("");
          setAmount(0);
        }}>Add</Button>
      </div>
    </>
  )
}

function ExploreScreen(props) {
  const {width} = useWindowDimensions();
  let [suggestions, setSuggestions] = useState([]);
  const [detailed, setDetailed] = useState("");
  const [name, setName] = useState("");
  const [relevance, setRelevance] = useState(-1);
  const [writtenPost, setWrittenPost] = useState("");
  const [posts, setPosts] = useState([
    ["I bought lots of GS shares this week! Everyone else should buy too 😉", "Marcus Goldman", new Date(2021, 10, 14, 6, 43, 26)],
    ["Elon will dump his remaining shares, Rivian IPO will back track off its insane valuation, and Lucid earnings will elicit no less than a 10% retrace. We all know EV is a sympathy category and the combination of these factors sets up some solid put plays this week. Tesla puts are super pricey, and Rivian puts will be too, but Lucid puts in the $40 range are looking juicy!", "Jeff Bezos", new Date(2021, 10, 14, 7, 52, 31)],
    ["The good news is demand hasn’t been destroyed. It’s been delayed. I think supply chain issues should get sorted out. Some components of CPI, like higher used car prices, show that the inflation should be temporary!", "Jake from State Farm", new Date(2021, 10, 14, 8, 30, 23)],
    ["CommonWealth is a super neat app 🙂", "Temoc", new Date(2021, 10, 14, 9, 2, 33)]
  ]);
  // props.searchTags;
  useEffect(() => {
    if (props.searchTags.length > 0) {
      fetch("http://127.0.0.1:5000/get_random_query/" + props.searchTags).then(response => response.json()).then(data => {
        let result = [];
        for (let i in data)
          result.push({symbol: data[i][0], name: companies[data[i][0]][0], relevance: data[i][1]});
        setSuggestions(result);
      });
    } else {
      setSuggestions([]);
    }
  }, [props.searchTags]);

  function handleDetailView(symbol, name, relevance, numStocks) {
    setDetailed(symbol);
    setName(name);
    setRelevance(relevance);
  }

  return (
    <div style={{
      paddingLeft: 370,
      textAlign: 'left',
      color: '#eeeeee',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#111111',
      width: width - 370
    }}>
      <AnimateSharedLayout>
        {suggestions.map(suggestion => (
          <ExploreStock key={suggestion.symbol} symbol={suggestion.symbol} name={suggestion.name} time={"1W"} relevance={suggestion.relevance} handleDetailView={handleDetailView} numStocks={-1} searchTags={props.searchTags}/>
        ))}
        {suggestions.length === 0 && (
          <>
            <span style={{fontWeight: 'bold', fontSize: 36, marginBottom: 10, color: 'rgb(255, 204, 0)', fontFamily: "Caviar Dreams"}}>Frequently Searched</span>
            {["GS"].map(symbol => (
              <ExploreStock key={symbol} symbol={symbol} name={companies[symbol][0]} time={"1W"} relevance={[]} handleDetailView={handleDetailView} numStocks={-1} searchTags={props.searchTags}/>
            ))}
            <Divider width="700"/>
            <span style={{fontWeight: 'bold', fontSize: 36, marginBottom: 10, marginTop: 10, color: 'rgb(255, 204, 0)', fontFamily: "Caviar Dreams"}}>Most Active</span>
            {["PSFE"].map(symbol => (
              <ExploreStock key={symbol} symbol={symbol} name={companies[symbol][0]} time={"1W"} relevance={[]} handleDetailView={handleDetailView} numStocks={-1} searchTags={props.searchTags}/>
            ))}
            <Divider width="700"/>
            <span style={{fontWeight: 'bold', fontSize: 36, marginBottom: 10, marginTop: 10, color: 'rgb(255, 204, 0)', fontFamily: "Caviar Dreams"}}>Trending Now</span>
            {["TSLA"].map(symbol => (
              <ExploreStock key={symbol} symbol={symbol} name={companies[symbol][0]} time={"1W"} relevance={[]} handleDetailView={handleDetailView} numStocks={-1} searchTags={props.searchTags}/>
            ))}
            <Divider width="700"/>
            <div style={{maxWidth: 700, marginTop: 48, display: 'flex', flexDirection: 'column'}}>
              <TextField multiline rows={4} maxRows={4} value={writtenPost} onChange={event => setWrittenPost(event.target.value)} label="Write Post" placeholder="Write a post to share with the world" fullWidth/>
              <Button variant='outlined' style={{alignSelf: 'flex-start', marginTop: 10, marginBottom: 48}} onClick={() => {
                setPosts(posts.concat([[writtenPost, author, new Date()]]));
                setWrittenPost("");
              }}>Post</Button>
            </div>
            <Divider width="700"/>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              {posts.map(post => (
                <>
                  <div style={{display: 'flex', margin: 45, marginBottom: 10, color: '#cccccc', fontWeight: 'bold', fontFamily: 'Caviar Dreams', fontSize: 22}}>
                    <span>{post[1]}</span>
                    <span style={{marginLeft: 20, fontSize: 18, alignSelf: 'center', color: '#666666'}}>Today at {post[2].toLocaleTimeString()}</span>
                  </div>
                  <span style={{margin: 45, marginTop: 0, width: 610, fontFamily: 'Caviar Dreams'}}>{post[0]}</span>
                  <Divider width="700"/>
                </>
              ))}
            </div>
          </>
        )}
        <Backdrop showBackdrop={detailed !== ""} leaveDetailed={() => setDetailed("")}/>
        {detailed !== "" && <DetailedView symbol={detailed} name={name} relevance={relevance} numStocks={-1}/>}
      </AnimateSharedLayout>
    </div>
  );
}

function App() {
  const {width, height} = useWindowDimensions();
  const [state, setState] = useState("atHome");
  const variantHome = {
    atHome: {
      clipPath: `circle(10000px at 382px -82px)`,
    },
    transitionToExplore: {
      clipPath: `circle(1337px at 382px -82px)`,
    },
    atExplore: {
      clipPath: `circle(0px at 382px -82px)`,
    },
    transitionToHome: {
      clipPath: `circle(1337px at 382px -82px)`,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    },
  }
  const variantExplore = {
    atHome: {
      clipPath: `circle(0px at ${width - 382}px -82px)`,
    },
    transitionToExplore: {
      clipPath: `circle(1337px at ${width - 382}px -82px)`,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    },
    atExplore: {
      clipPath: `circle(10000px at ${width - 382}px -82px)`,
    },
    transitionToHome: {
      clipPath: `circle(1337px at ${width - 382}px -82px)`,
    },
  }

  function changeScreen(screen) {
    if (screen && state === "atHome") {
      // go to home screen
      setState("transitionToExplore");
    } else if (!screen && state === "atExplore") {
      // go to explore screen
      setState("transitionToHome");
    }
  }

  function animationComplete() {
    if (state === "transitionToExplore") {
      setState("atExplore");
    } else if (state === "transitionToHome") {
      setState("atHome");
    }
  }

  const [searchTags, setSearchTags] = useState([]);

  return (
    <div className="App" style={{backgroundColor: "#111111", position: 'absolute', width: '100%', height: height * 20}}>
      <motion.header className="App-header" animate={state} onAnimationComplete={animationComplete}>
        <Header changeScreen={changeScreen} state={state} searchTags={searchTags} setSearchTags={setSearchTags}/>
        <motion.div style={{position: state === "atHome" ? 'block' : 'absolute', top: 164, zIndex: (
          state === "atHome" || state === "transitionToHome" ? 2 : 1
        )}} variants={variantHome}>
          <HomeScreen/>
        </motion.div>
        <motion.div style={{position: state === "atExplore" ? 'block' : 'absolute', top: 164, zIndex: (
          state === "atExplore" || state === "transitionToExplore" ? 2 : 1
        )}} variants={variantExplore}>
          <ExploreScreen searchTags={searchTags}/>
        </motion.div>
      </motion.header>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Button, Text, ScrollView, Dimensions } from 'react-native';
import { TextField } from 'react-native-material-textfield';
import Modal from 'react-native-modal';
import DatePicker from 'react-native-datepicker';
import { Table, Row, Rows } from 'react-native-table-component';
import moment from 'moment';
import {
  AdMobBanner,
  AdMobInterstitial,
  PublisherBanner,
  AdMobRewarded
} from 'expo-ads-admob';
var Datastore = require('react-native-local-mongodb')
  , db = new Datastore({ filename: 'simpleCashBook2.wm', autoload: true, timestampData: true });

export default function App() {

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [transactions, setTransactions] = useState([[], []]);

  const [amount, setAmount] = useState();
  const [transactionType, setTransactionType] = useState();
  const [remark, setRemark] = useState('');
  const [date, setDate] = useState(new Date());

  const [amountError, setAmountError] = useState();
  const [remarkError, setRemarkError] = useState();

  const tableHeads = ['Date', 'Particular', 'Credit', 'Debit', 'Balance'];
  const widthArr = [
    Dimensions.get('window').width / 100 * 16,
    Dimensions.get('window').width / 100 * 36,
    Dimensions.get('window').width / 100 * 16,
    Dimensions.get('window').width / 100 * 16,
    Dimensions.get('window').width / 100 * 16,
  ];



  const fetchTransactions = () => {
    db.find({}).sort({ date: 1, createdAt: 1 }).exec((err, transactions) => {

      let t = [];
      balance = 0;
      transactions.forEach(transaction => {
        let debit = '';
        let credit = '';
        if (transaction.type == 'in') {
          credit = parseInt(transaction.amount);
          balance = balance + parseInt(transaction.amount);
        } else {
          debit = parseInt(transaction.amount);
          balance = balance - parseInt(transaction.amount);
        }

        t.push([moment(transaction.date).format('DD-MM-YY'), transaction.remark, credit, debit, balance])
      });
      setTransactions(t);
    });
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onCashInPressHandler = () => {
    showInterstitial();
    setIsModalVisible(true);
    setTransactionType('in');
  }

  const onCashOutPressHandler = () => {
    setIsModalVisible(true);
    setTransactionType('out');
  }

  const saveHandler = () => {
    if (isNaN(parseInt(amount))) {
      setAmountError('Please Enter Amount');
      return;
    } else {
      setAmountError(null);
    }


    if (remark.trim().length !== 0) {
      setRemarkError(null);
    } else {
      setRemarkError('Please Enter Remark');
      setRemark('');
      return;
    }


    let transaction = {
      date: date,
      remark: remark,
      amount: amount,
      type: transactionType,
    }
    db.insert(transaction, function (err, newDoc) {
      setIsModalVisible(false);
      fetchTransactions();
    });

  }

  showInterstitial = async () => {
    // Test interstitial ad id
    //AdMobInterstitial.setAdUnitID('ca-app-pub-3940256099942544/1033173712');
    AdMobInterstitial.setAdUnitID('ca-app-pub-5727666922815729/4657576913');
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    await AdMobInterstitial.showAdAsync();
  }

  return (
    <View style={styles.container}>
      <View style={styles.statement}>
        <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
          <Row data={tableHeads} style={styles.head} widthArr={widthArr} />
        </Table>
        <ScrollView>
          <Table borderStyle={{ borderWidth: 2, borderColor: '#C1C0B9' }} >
            {/* <Rows data={transactions} textStyle={styles.text} /> */}
            {
              transactions.map((transaction, index) =>
                <Row
                  key={index}
                  data={transaction}
                  widthArr={widthArr}
                  style={[styles.row, index % 2 && { backgroundColor: '#F7F6E7' }]}
                  textStyle={styles.text}
                />
              )
            }
          </Table>
        </ScrollView>
      </View>

      <View style={styles.buttons}>
        <Button title="Cash In" onPress={onCashInPressHandler} />
        <Button title="Cash Out" onPress={onCashOutPressHandler} />
      </View>
      <Modal
        isVisible={isModalVisible}
        animationType="fancy"
        transparent={true}
        onBackdropPress={() => setIsModalVisible(false)} >
        <View style={styles.modal}>
          <View style={{ flex: 1 }}>
            <Text style={{textAlign: 'center', fontWeight: 'bold', fontSize: 18, marginBottom: 15}} >
              Cash {transactionType}
            </Text>
            <DatePicker
              onDateChange={date => setDate(moment(date, 'DD-MM-YY').toDate())}
              date={date}
              format="DD-MM-YY"
              androidMode="spinner"
            />
            <TextField
              onChangeText={amount => setAmount(amount)}
              value={amount}
              label="Amount"
              keyboardType="numeric"
              error={amountError}
            />
            <TextField
              onChangeText={remark => setRemark(remark)}
              value={remark}
              label="Remark"
              error={remarkError}
            />
            <Button title="Save" onPress={saveHandler} />
          </View>
        </View>
      </Modal>

    </View >
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', flex: 1, backgroundColor: 'white' },
  statement: { flex: 1, flexGrow: 92, paddingTop: 30 },
  head: { height: 40, backgroundColor: '#f1f8ff' },
  statementRow: {
    backgroundColor: 'red',
    flexDirection: 'row',
    justifyContent: "space-between"
  },
  buttons: {
    flex: 1,
    alignItems: 'center',
    flexGrow: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#9803fc',
  },
  modal: {
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: "white",
    borderRadius: 4,
    padding: 4
  },
  row: { minHeight: 40, backgroundColor: '#E7E6E1', },
  text: { margin: 2 },


});

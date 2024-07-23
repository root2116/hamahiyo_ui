import React from 'react'; 
import styles from './App.module.css';
import { Message } from './Message.js';
import { Header } from './Header.js';

import { useState, useRef } from 'react';
import Maintenance from './Maintenance.js';



function App() {
  const targetRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const is_maintenance = process.env.REACT_APP_MAINTENANCE_MODE === 'true';


  const handleGenerateClick = async () => {

    setLoading(true); // ローディング開始
    setMessages([]); // メッセージをクリア

    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const startTaskResponse = await fetch(`${apiUrl}/generate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!startTaskResponse.ok) {
        throw new Error('Failed to start task');
      }

      const startTaskData = await startTaskResponse.json();

      if (startTaskData.message) {
        console.log("Message: ", startTaskData.message);
        
        //　改行文字があるか？
        if (startTaskData.message.includes("\n")) {
          // 改行文字で分割
          console.log("yes")
        } else {
          console.log("no")
        }
        setMessages([startTaskData.message]);
      } else if (startTaskData.job_id) {
        let jobId = startTaskData.job_id;

        const checkStatus = async (jobId) => {
          const statusResponse = await fetch(`${apiUrl}/task-status/${jobId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (!statusResponse.ok) {
            throw new Error('Failed to check status');
          }

          return statusResponse.json();
        };

        let taskStatus;
        do {
          await new Promise(resolve => setTimeout(resolve, 1000));
          taskStatus = await checkStatus(jobId);

          // statusがretryだったらjob_idを更新
          if (taskStatus.status === 'retry') {
            console.log("Retrying...");
            jobId = taskStatus.job_id;
          }
        } while (taskStatus.status !== 'finished');

        if (taskStatus.result) {

          setMessages(taskStatus.result);
        } else {
          console.log("Invalid response format: ", taskStatus);
        }

      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false); // ローディング終了
    }
  };

  const renderMessage = (message) => {
    return message.split('\n').map((part, index) => (
      <React.Fragment key={index}>
        {part}
        <br />
      </React.Fragment>
    ));
  };


  if (is_maintenance) {
    return <Maintenance />;
  }
  

  return (
    <div className={styles.container}>
      <div className={styles.talk_box}>
        <div ref={targetRef}>
          <Header />
          <Message message="やほー！" />
          {loading ? (
            <div className={styles.loader}></div> // ローディングスピナーを表示
          ) : (
            messages.map((message, index) => (
              <Message key={index} message={renderMessage(message)} />
            ))
          )}
        </div>
      </div>
      <div className={styles.footer}>
        <button onClick={handleGenerateClick} className={styles.button}>生成</button>
      </div>
    </div>
  );
}

export default App;

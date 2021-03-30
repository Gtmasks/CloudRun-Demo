<h1>breeze-collection-job-lambda</h1>

<h3>任务来源：</h3>

* 由 breez-cron-jobs-lambda 定时任务发起
* 通过lambda的异步调用，在调用时将任务信息放入event
* 通过任务中品牌信息，启动对应的 collector 进行数据采集

<h3>输出</h3>

* 结果写入名为 breeze-${brand}-stream-${profile} 的Kinesis Data Stream
* 具体写入内容参见各 collector 的 Storage 实现
* 通过Kinesis Data Stream，数据被分为两路，一路写入数据库，一路写入 S3

<h3>添加新的 collector 支持</h3>

* 需要继承 Collector 类，并实现采集的 Method 和存储的 Storage

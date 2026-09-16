<?php
define('API_ACCESS_KEY','AIzaSyAyVVS2zjKGPxuTl5vhdQSxyzwr1psPBVI');
 $fcmUrl = 'https://fcm.googleapis.com/fcm/send';
 $token= 'ccUFwR8zS1GFmW1BWh5GtQ:APA91bHOxvi96msdmMHxYymMl1k2yxHrusk83wzqBg4ejb1K7s6XHy0OuU_HU3qKxezIs5Ox6ubnMSvkvh9dw41hgYzycxzJuGdxrtxVtHfksmDF17j7scsYLGa2ze7WhznllA5rxXeP'; //해당 Device TokenKey
    $notification = [
            'title' =>'title',
            'body' => 'body of message.',
            'icon' =>'myIcon', 
            'sound' => 'mySound'
        ];
        $extraNotificationData = ["message" => $notification,"moredata" =>'dd'];
        $fcmNotification = [
            //'registration_ids' => $tokenList, //multple token array
            'to'        => $token, //single token
            'notification' => $notification,
            'data' => $extraNotificationData
        ];
        $headers = [
            'Authorization: key=' . API_ACCESS_KEY,
            'Content-Type: application/json'
        ];


        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL,$fcmUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fcmNotification));
        $result = curl_exec($ch);
        curl_close($ch);


        echo $result;
?>
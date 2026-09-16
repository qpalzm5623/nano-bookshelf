<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class MY_Input extends CI_Input
{
    public function __construct()
    {
        parent::__construct();
    }

    public function ip_address()
    {
        if($this->ip_address !== FALSE)
        {
            return $this->ip_address;
        }

        if( ! $this->server('HTTP_CLIENT_IP') && $this->valid_ip($this->server('HTTP_CLIENT_IP')) )
        {
            $this->ip_address = $this->server('HTTP_CLIENT_IP');
        }
        else if( ! $this->server('HTTP_X_FORWARDED_FOR') && $this->valid_ip($this->server('HTTP_X_FORWARDED_FOR')) )
        {
            $this->ip_address = $this->server('HTTP_X_FORWARDED_FOR');
        }
        else if( ! $this->server('HTTP_X_FORWARDED') && $this->valid_ip($this->server('HTTP_X_FORWARDED')) )
        {
            $this->ip_address = $this->server('HTTP_X_FORWARDED');
        }
        else if( ! $this->server('HTTP_FORWARDED_FOR') && $this->valid_ip($this->server('HTTP_FORWARDED_FOR')) )
        {
            $this->ip_address = $this->server('HTTP_FORWARDED_FOR');
        }
        else if( ! $this->server('HTTP_FORWARDED') && $this->valid_ip($this->server('HTTP_FORWARDED')) )
        {
            $this->ip_address = $this->server('HTTP_FORWARDED');
        }
        else
        {
            parent::ip_address();
        }

        return $this->ip_address();
    }
}

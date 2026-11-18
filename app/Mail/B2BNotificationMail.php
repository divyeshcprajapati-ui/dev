<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class B2BNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $emailSubject;
    public string $headline;
    public array $lines;
    public ?string $actionLabel;
    public ?string $actionUrl;
    public string $storeName;

    public function __construct(
        string $emailSubject,
        string $headline,
        array $lines,
        ?string $actionLabel = null,
        ?string $actionUrl = null,
        string $storeName = 'B2B Hub'
    ) {
        $this->emailSubject = $emailSubject;
        $this->headline = $headline;
        $this->lines = $lines;
        $this->actionLabel = $actionLabel;
        $this->actionUrl = $actionUrl;
        $this->storeName = $storeName;
    }

    public function build()
    {
        return $this->subject($this->emailSubject)
            ->view('emails.b2b_notification');
    }
}

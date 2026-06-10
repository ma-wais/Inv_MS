<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthenticationRoutesTest extends TestCase
{
    public function test_guests_can_view_the_login_page(): void
    {
        $this->get('/login')->assertOk();
    }

    public function test_guests_are_redirected_from_the_dashboard(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }
}

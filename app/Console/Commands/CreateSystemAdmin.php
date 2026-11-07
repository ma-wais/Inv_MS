<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateSystemAdmin extends Command
{
    protected $signature = 'ventory:admin {email} {--name=System Administrator}';

    protected $description = 'Create a platform administrator with an interactively entered password';

    public function handle(): int
    {
        $email = trim((string) $this->argument('email'));
        $password = $this->secret('Password (at least 12 characters, uppercase/lowercase and numbers)');
        $confirmation = $this->secret('Confirm password');
        $validator = Validator::make(['email' => $email, 'name' => $this->option('name'), 'password' => $password, 'password_confirmation' => $confirmation], [
            'email' => ['required', 'email', 'max:255', 'unique:users,email'], 'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()],
        ]);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }
        User::create(['email' => $email, 'name' => $this->option('name'), 'password' => $password, 'is_super_admin' => true, 'status' => 'active']);
        $this->info('Platform administrator created. Existing accounts were not changed.');

        return self::SUCCESS;
    }
}
